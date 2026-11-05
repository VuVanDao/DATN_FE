import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ProjectView } from '../../../../../view-models/project.view-model';

@Component({
  selector: 'app-project-hero-header',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './project-hero-header.component.html',
  host: {
    class: 'block',
  },
})
export class ProjectHeroHeaderComponent {
  readonly project = input.required<ProjectView>();

  readonly back = output<void>();
  readonly addMember = output<void>();
  readonly openSettings = output<void>();
  readonly selectTab = output<'boards' | 'members'>();
}
