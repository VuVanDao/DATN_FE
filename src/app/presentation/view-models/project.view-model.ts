import { Project } from '../../domain/models/project.model';

export interface ProjectView extends Project {
  initial: string;
  gradientColor: string;
}

export function toProjectView(project: Project): ProjectView {
  let initial = '';

  // Calculate a clean 2-3 letter initial for the avatar
  if (project.name && project.name.trim().length > 0) {
    const words = project.name.trim().split(/\s+/);
    if (words.length >= 2) {
      initial = (
        words[0].charAt(0) +
        words[1].charAt(0) +
        (words[2] ? words[2].charAt(0) : '')
      ).toUpperCase();
    } else {
      initial = project.name.slice(0, 3).toUpperCase();
    }
  } else if (project.projectKey) {
    initial = project.projectKey.slice(0, 3).toUpperCase();
  } else {
    initial = 'PRJ';
  }

  // Ensure avatar text never exceeds 3 characters
  initial = initial.slice(0, 3);

  return {
    ...project,
    initial,
    gradientColor: 'bg-linear-to-br from-purple-600 via-indigo-600 to-purple-800',
  };
}

export function getBoardIcon(type: string): string {
  const normalized = (type || '').toLowerCase();
  if (normalized.includes('scrum')) return 'rocket_launch';
  return 'view_column';
}

export function getBoardBadgeColor(type: string): { bg: string; text: string; border: string } {
  const normalized = (type || '').toLowerCase();
  if (normalized.includes('scrum')) {
    return {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border-emerald-500/20',
    };
  }
  return {
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/20',
  };
}
