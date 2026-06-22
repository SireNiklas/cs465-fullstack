import { Inject, Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { BROWSER_STORAGE } from './storage';
import { User } from './user';
import { AuthResponse } from './authresponse';
import { TripDataService } from './trip-data.service';

@Injectable({ providedIn: 'root' })
export class AuthenticationService {
  constructor(
    @Inject(BROWSER_STORAGE) private storage: Storage,
    private tripDataService: TripDataService
  ) {}

  public getToken(): string | null {
    return this.storage.getItem('travlr-token');
  }

  public saveToken(token: string): void {
    this.storage.setItem('travlr-token', token);
  }

  public logout(): void {
    this.storage.removeItem('travlr-token');
  }

  public isLoggedIn(): boolean {
    const token = this.getToken();
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp > Date.now() / 1000;
    }
    return false;
  }

  public getCurrentUser(): User | null {
    if (this.isLoggedIn()) {
      const token = this.getToken();
      const { email, name } = JSON.parse(atob(token!.split('.')[1]));
      return { email, name } as User;
    }
    return null;
  }

  public login(user: User, passwd: string): Observable<AuthResponse> {
    return this.tripDataService
      .login(user, passwd)
      .pipe(tap((res) => this.saveToken(res.token)));
  }

  public register(user: User, passwd: string): Observable<AuthResponse> {
    return this.tripDataService
      .register(user, passwd)
      .pipe(tap((res) => this.saveToken(res.token)));
  }
}
