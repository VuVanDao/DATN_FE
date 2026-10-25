import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const root = path.resolve('src/app');
const walk = (directory) =>
  fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(file) : [file];
  });
const errors = [];
let count = 0;
for (const file of walk(root).filter(
  (file) => file.endsWith('.ts') && !file.endsWith('.spec.ts'),
)) {
  const relative = path.relative(root, file).replaceAll('\\', '/');
  const layer = relative.split('/')[0];
  const source = ts.createSourceFile(
    file,
    fs.readFileSync(file, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
  );
  function check(specifier) {
    count++;
    if (
      layer === 'application' &&
      (specifier === 'ngx-sonner' || specifier === '@angular/common/http')
    ) {
      errors.push(`${relative}: use an application port instead of ${specifier}`);
    }
    if (!specifier.startsWith('.')) return;
    const target = path.resolve(path.dirname(file), specifier);
    const targetLayer = path.relative(root, target).replaceAll('\\', '/').split('/')[0];
    if (
      (layer === 'domain' && !['domain', 'shared'].includes(targetLayer)) ||
      (['application', 'infrastructure'].includes(layer) && targetLayer === 'presentation')
    ) {
      errors.push(`${relative}: ${layer} must not import ${targetLayer}`);
    }
    // Windows also needs to catch case mismatches before a Linux build does.
    const resolved = [target + '.ts', path.join(target, 'index.ts')].find((candidate) =>
      fs.existsSync(candidate),
    );
    if (!resolved) {
      errors.push(`${relative}: unresolved import ${specifier}`);
      return;
    }
    let current = root;
    for (const segment of path.relative(root, resolved).split(path.sep)) {
      if (segment === '..') {
        current = path.dirname(current);
        continue;
      }
      if (!fs.readdirSync(current).includes(segment)) {
        errors.push(`${relative}: import casing does not match ${specifier}`);
        break;
      }
      current = path.join(current, segment);
    }
  }
  function visit(node) {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    )
      check(node.moduleSpecifier.text);
    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments[0] &&
      ts.isStringLiteral(node.arguments[0])
    )
      check(node.arguments[0].text);
    ts.forEachChild(node, visit);
  }
  visit(source);
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else console.log(`Architecture checks passed (${count} imports).`);
