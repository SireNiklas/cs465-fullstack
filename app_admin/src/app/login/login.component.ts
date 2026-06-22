import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthenticationService } from '../authentication.service';
import { User } from '../user';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  public formError = '';
  public credentials = { name: '', email: '', password: '' };

  constructor(
    private router: Router,
    private authenticationService: AuthenticationService
  ) {}

  public onLoginSubmit(): void {
    this.formError = '';
    if (!this.credentials.email || !this.credentials.password) {
      this.formError = 'All fields are required, please try again';
      return;
    }
    const user: User = { name: '', email: this.credentials.email };
    this.authenticationService.login(user, this.credentials.password).subscribe({
      next: () => this.router.navigateByUrl('/'),
      error: (err) => {
        this.formError = 'Invalid login, please try again';
        console.error(err);
      }
    });
  }
}
