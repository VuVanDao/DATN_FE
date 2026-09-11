import { Component, inject, OnInit } from '@angular/core';
import { AuthStore } from '../../state/auth.store';
import { LayoutService } from '../../../application/layout/layout.service';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.html',
})
export class HomePage implements OnInit {
  readonly authStore = inject(AuthStore);
  private readonly layoutService = inject(LayoutService);

  ngOnInit(): void {
    this.layoutService.setSidebar('main');
  }
}
