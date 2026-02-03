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

  downloadReport(): void {
    const today = new Date();

    this.http
      .get(
        `${environment.apiUrl}/reports/monthly?userId=${this.userData.user().id}&month=${today.getMonth() + 1}&year=${today.getFullYear()}`,
        { responseType: 'blob' },
      )
      .pipe(take(1))
      .subscribe({
        next: (res: any) => {
          const blob = res as Blob;
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'worklog.csv';
          a.click();
          window.URL.revokeObjectURL(url);
        },
        error: (err) => {
          this.routerService.navigate(['/error', err.status]);
        },
      });
  }
}
