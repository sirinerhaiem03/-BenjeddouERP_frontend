import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {
  resetForm: FormGroup;
  token = '';
  loading = false;
  success = false;
  errorMsg = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {
    this.resetForm = this.fb.group({
      motDePasse: ['', [Validators.required, Validators.minLength(6)]],
      confirmMotDePasse: ['', Validators.required]
    }, { validator: this.passwordConfirmValidator });
  }

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParams['token'] || '';
    if (!this.token) {
      this.errorMsg = 'Jeton de réinitialisation manquant ou invalide.';
    }
  }

  passwordConfirmValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const password = control.get('motDePasse');
    const confirm = control.get('confirmMotDePasse');
    if (password && confirm && password.value !== confirm.value) {
      return { 'passwordMismatch': true };
    }
    return null;
  }

  onSubmit(): void {
    if (this.resetForm.invalid || !this.token) return;

    this.loading = true;
    this.errorMsg = '';

    const newPassword = this.resetForm.value.motDePasse;

    this.authService.resetPassword(this.token, newPassword).subscribe({
      next: () => {
        this.loading = false;
        this.success = true;
      },
      error: (err) => {
        this.loading = false;
        console.error(err);
        this.errorMsg = err.error?.message || "Une erreur est survenue lors de la réinitialisation de votre mot de passe.";
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
