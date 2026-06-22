import { Inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Trip } from './models/trip';
import { User } from './user';
import { AuthResponse } from './authresponse';
import { BROWSER_STORAGE } from './storage';

@Injectable({ providedIn: 'root' })
export class TripDataService {
  constructor(
    private http: HttpClient,
    @Inject(BROWSER_STORAGE) private storage: Storage
  ) {}

  private apiBaseUrl = 'http://localhost:3000/api';
  private url = `${this.apiBaseUrl}/trips`;

  getTrips(): Observable<Trip[]> {
    return this.http.get<Trip[]>(this.url);
  }

  getTrip(tripCode: string): Observable<Trip[]> {
    return this.http.get<Trip[]>(`${this.url}/${tripCode}`);
  }

  addTrip(formData: Trip): Observable<Trip> {
    return this.http.post<Trip>(this.url, formData, {
      headers: this.authHeaders()
    });
  }

  updateTrip(tripCode: string, formData: Trip): Observable<Trip> {
    return this.http.put<Trip>(`${this.url}/${tripCode}`, formData, {
      headers: this.authHeaders()
    });
  }

  deleteTrip(tripCode: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${tripCode}`, {
      headers: this.authHeaders()
    });
  }

  login(user: User, passwd: string): Observable<AuthResponse> {
    return this.handleAuthCall('login', user, passwd);
  }

  register(user: User, passwd: string): Observable<AuthResponse> {
    return this.handleAuthCall('register', user, passwd);
  }

  private handleAuthCall(
    endpoint: string,
    user: User,
    passwd: string
  ): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiBaseUrl}/${endpoint}`, {
      name: user.name,
      email: user.email,
      password: passwd
    });
  }

  private authHeaders(): HttpHeaders {
    const token = this.storage.getItem('travlr-token');
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }
}
