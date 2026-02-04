import { inject, Injectable } from '@angular/core';
import { UserDataService } from './user-data.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { take } from 'rxjs/internal/operators/take';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class ReportService {
  private userData = inject(UserDataService);
  private routerService = inject(Router);
  private http = inject(HttpClient);

  downloadReport(userId:number = this.userData.user().id, date: Date = new Date()): void {

    this.http
      .get(
        `${environment.apiUrl}/reports/monthly?userId=${userId}&month=${date.getMonth() + 1}&year=${date.getFullYear()}`,
        { responseType: 'blob' },
      )
      .pipe(take(1))
      .subscribe({
        next: (res: any) => {
          const blob = res as Blob;
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `user-${userId}.csv`;
          a.click();
          window.URL.revokeObjectURL(url);
        },
        error: (err) => {
          this.routerService.navigate(['/error', err.status]);
        },
      });
  }

  emailReport(userId: number = this.userData.user().id, email: string = this.userData.user().email, date: Date = new Date()): void {
    this.http
      .post(
        `${environment.apiUrl}/reports/email`,
        {
          userId: userId,
          email: email,
          month: date.getMonth() + 1,
          year: date.getFullYear(),
        },
        { responseType: 'text' },
      )
      .pipe(take(1))
      .subscribe({
        next: () => {
        },
        error: (err) => {
          this.routerService.navigate(['/error', err.status]);
        },
      });
  }
}
