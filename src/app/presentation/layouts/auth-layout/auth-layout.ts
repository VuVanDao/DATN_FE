import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoginPage } from '../../pages/auth/login';

@Component({
  imports: [RouterOutlet],
  selector: 'app-auth-layout',
  standalone: true,
  templateUrl: './auth-layout.html',
})
export class Authlayout {}
