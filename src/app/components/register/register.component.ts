import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  errorMessage: string = '';
  successMessage: string = '';
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

    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    return null;
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';

      const { name, email, password } = this.registerForm.value;
      
      if (this.authService.register({ name, email, password })) {
        this.successMessage = 'Account created successfully! Logging in...';
        setTimeout(() => {
          // Use username (email) for login
          this.authService.login(email, password).subscribe({
            next: (success) => {
              if (success) {
                this.router.navigate(['/dashboard']);
              } else {
                // Fallback to local login
                if (this.authService.loginLocal(email, password)) {
                  this.router.navigate(['/dashboard']);
                } else {
                  this.errorMessage = 'Registration successful but login failed. Please try logging in manually.';
                }
              }
              this.isLoading = false;
            },
            error: () => {
              // Fallback to local login if API fails
              if (this.authService.loginLocal(email, password)) {
                this.router.navigate(['/dashboard']);
              } else {
                this.errorMessage = 'Registration successful but login failed. Please try logging in manually.';
              }
              this.isLoading = false;
            }
          });
        }, 1500);
      } else {
        this.errorMessage = 'Email is already registered';
        this.isLoading = false;
      }
    } else {
      this.errorMessage = 'Please fill all fields correctly';
    }
  }

  get name() {
    return this.registerForm.get('name');
  }

  get email() {
    return this.registerForm.get('email');
  }

  get password() {
    return this.registerForm.get('password');
  }

  get confirmPassword() {
    return this.registerForm.get('confirmPassword');
  }
}

