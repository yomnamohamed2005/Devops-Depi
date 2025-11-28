import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface User {
  email?: string;
  username?: string;
  password?: string;
  name?: string;
  roles?: string[];
}

export interface LoginModel {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  expiration: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;
  private tokenKey = 'authToken';
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    const storedToken = localStorage.getItem(this.tokenKey);
    const storedUser = localStorage.getItem('currentUser');
    
    this.currentUserSubject = new BehaviorSubject<User | null>(
      storedUser ? JSON.parse(storedUser) : null
    );
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  public getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  public getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    const headers: { [key: string]: string } = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return new HttpHeaders(headers);
  }

  public getAuthHeadersWithOptions(): { headers: HttpHeaders } {
    return { headers: this.getAuthHeaders() };
  }

  login(username: string, password: string): Observable<boolean> {
    // Check if API is enabled and URL is set
    if (!environment.enableApi || !this.apiUrl) {
      return throwError(() => new Error('API disabled'));
    }
    
    const loginModel: LoginModel = { username, password };
    
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, loginModel)
      .pipe(
        map(response => {
          if (response && response.token) {
            // Store token
            localStorage.setItem(this.tokenKey, response.token);
            
            // Decode token to get user info (simple decode, in production use proper JWT library)
            const user: User = {
              username: username,
              name: username
            };
            
            localStorage.setItem('currentUser', JSON.stringify(user));
            this.currentUserSubject.next(user);
            return true;
          }
          return false;
        }),
        catchError(error => {
          // Only log error if it's not a connection error (API not available)
          if (error.status !== 0 && error.status !== undefined) {
            console.error('Login error:', error);
          }
          return throwError(() => error);
        })
      );
  }

  // Fallback login for local testing if API is not available
  loginLocal(username: string, password: string): boolean {
    // Default account for testing
    if (username === 'admin' && password === 'admin123') {
      const user: User = {
        username: 'admin',
        name: 'Admin User'
      };
      localStorage.setItem('currentUser', JSON.stringify(user));
      this.currentUserSubject.next(user);
      return true;
    }
    return false;
  }

  // Register method - for local storage fallback
  register(userData: { name: string; email: string; password: string }): boolean {
    // Check if user already exists in localStorage
    const storedUsers = localStorage.getItem('localUsers');
    let users: any[] = [];
    
    if (storedUsers) {
      users = JSON.parse(storedUsers);
    }
    
    // Check if email already exists
    if (users.find((u: any) => u.email === userData.email)) {
      return false;
    }
    
    // Add new user
    users.push({
      email: userData.email,
      username: userData.email.split('@')[0],
      name: userData.name,
      password: userData.password
    });
    
    localStorage.setItem('localUsers', JSON.stringify(users));
    return true;
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    
    // Check if token is expired (simple check)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationDate = new Date(payload.exp * 1000);
      if (expirationDate < new Date()) {
        this.logout();
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }
}
