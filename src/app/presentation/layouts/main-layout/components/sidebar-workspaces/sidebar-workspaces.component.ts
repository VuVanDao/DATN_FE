import { Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { WorkspaceView } from '../../../../view-models/workspace.view-model';
@Component({
  selector: 'app-sidebar-workspaces',
  standalone: true,
  imports: [RouterLink, MatIconModule, MatTooltipModule],
  templateUrl: './sidebar-workspaces.component.html',
})
export class SidebarWorkspacesComponent {
  readonly collapsed = input(false);
  readonly loading = input(false);
  readonly workspaces = input<WorkspaceView[]>([]);
  readonly totalCount = input(0);
  readonly create = output<void>();
}
