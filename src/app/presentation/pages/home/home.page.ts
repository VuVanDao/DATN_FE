import { Component, inject, OnInit } from '@angular/core';
import { LayoutService } from '../../../application/layout/layout.service';
import { AuthStore } from '../../../application/state/auth.store';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.page.html',
})
export class HomePage implements OnInit {
  readonly authStore = inject(AuthStore);
  private readonly layoutService = inject(LayoutService);

  ngOnInit(): void {
    this.layoutService.setSidebar('main');
  }
}
