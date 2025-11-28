import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  errorMessage: string = '';
  isLoading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Redirect if already logged in
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }

    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const { username, password } = this.loginForm.value;
      
      // Try API login first, fallback to local if API fails
      this.authService.login(username, password).subscribe({
        next: (success) => {
          if (success) {
            this.router.navigate(['/dashboard']);
          } else {
            // Fallback to local login
            if (this.authService.loginLocal(username, password)) {
              this.router.navigate(['/dashboard']);
            } else {
              this.errorMessage = 'Invalid username or password';
            }
          }
          this.isLoading = false;
        },
        error: (error) => {
          // Silently fallback to local login if API is not available
          // Only show error if it's not a connection error
          if (this.authService.loginLocal(username, password)) {
            this.router.navigate(['/dashboard']);
          } else {
            // Check if it's a connection error (API not available)
            if (error.status === 0 || error.status === undefined) {
              this.errorMessage = 'Invalid username or password';
            } else {
              this.errorMessage = 'Invalid username or password. Please check your connection.';
            }
          }
          this.isLoading = false;
        }
      });
    } else {
      this.errorMessage = 'Please fill all fields correctly';
    }
  }

  get username() {
    return this.loginForm.get('username');
  }

  get password() {
    return this.loginForm.get('password');
  }
}

