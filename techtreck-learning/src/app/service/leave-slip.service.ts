import { inject, Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { take } from 'rxjs';
import { LeaveSlip } from '../model/leave-slip.interface';
import { UserDataService } from './user-data.service';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class LeaveSlipService {
  private userData = inject(UserDataService);
  private router = inject(Router);
  private http = inject(HttpClient);

  private futureLeaves = signal<LeaveSlip[]>([]);
  private pastLeaves = signal<LeaveSlip[]>([]);
  private remainingTimeSignal = signal<number>(21600000); // 6 hours in milliseconds

  readonly futureLeaves$ = computed(() => this.futureLeaves());
  readonly pastLeaves$ = computed(() => this.pastLeaves());
  readonly remainingTime = computed(() => this.remainingTimeSignal());
  readonly leaveSlipData = computed(() => ({
    futureLeaves: this.futureLeaves(),
    pastLeaves: this.pastLeaves(),
    remainingTime: this.remainingTimeSignal(),
  }));

  loadLeaveSlips(): void {
    if (!this.userData.isLoggedIn()) return;

    const userId = this.userData.user().id;

    this.http
      .get<LeaveSlip[]>(`${environment.apiUrl}/leaverequest/user/${userId}/FUTURE`)
      .pipe(take(1))
      .subscribe({
        next: (res) => {
          this.futureLeaves.set(res);
        },
        error: (err) => {
          console.error('Error fetching future leave requests:', err);
          this.router.navigate(['/error', err.status]);
        },
      });

    this.http
      .get<LeaveSlip[]>(`${environment.apiUrl}/leaverequest/user/${userId}/PAST`)
      .pipe(take(1))
      .subscribe({
        next: (res) => {
          this.pastLeaves.set(res);
        },
        error: (err) => {
          console.error('Error fetching past leave requests:', err);
        },
      });

    this.loadRemainingTime();
  }

  private loadRemainingTime(): void {
    if (!this.userData.isLoggedIn()) return;

    this.http
      .get<number>(
        `${environment.apiUrl}/leaverequest/remaining/${this.userData.user().id}`
      )
      .pipe(take(1))
      .subscribe({
        next: (res) => {
          this.remainingTimeSignal.set(res);
        },
        error: (err) => {
          console.error('Error fetching remaining time:', err);
        },
      });
  }

  addLeaveSlip(leaveSlip: Omit<LeaveSlip, 'id'>): void {
    this.http
      .post<LeaveSlip>(`${environment.apiUrl}/leaverequest`, {
        userId: this.userData.user().id,
        startTime: leaveSlip.startTime,
        endTime: leaveSlip.endTime,
        description: leaveSlip.description,
      })
      .pipe(take(1))
      .subscribe({
        next: (newLeaveSlip) => {
          newLeaveSlip.userId = this.userData.user().id;
          this.futureLeaves.update((leaves) => [...leaves, newLeaveSlip]);
          this.loadRemainingTime();
        },
        error: (err) => {
          console.error('Error adding leave request:', err);
          this.router.navigate(['/error', err.status]);
        },
      });
  }

  updateLeaveSlip(leaveSlip: LeaveSlip): void {
    this.http
      .put<LeaveSlip>(`${environment.apiUrl}/leaverequest`, {
        id: leaveSlip.id,
        userId: this.userData.user().id,
        startTime: leaveSlip.startTime,
        endTime: leaveSlip.endTime,
        description: leaveSlip.description,
      })
      .pipe(take(1))
      .subscribe({
        next: (updatedLeaveSlip) => {
          this.futureLeaves.update((leaves) =>
            leaves.map((l) => (l.id === leaveSlip.id ? updatedLeaveSlip : l))
          );
          this.loadRemainingTime();
        },
        error: (err) => {
          console.error('Error updating leave request:', err);
          this.router.navigate(['/error', err.status]);
        },
      });
  }

  deleteLeaveSlip(leaveSlipId: number): void {
    this.http
      .delete<void>(`${environment.apiUrl}/leaverequest/${leaveSlipId}`)
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.futureLeaves.update((leaves) =>
            leaves.filter((l) => l.id !== leaveSlipId)
          );
          this.pastLeaves.update((leaves) =>
            leaves.filter((l) => l.id !== leaveSlipId)
          );
          this.loadRemainingTime();
        },
        error: (err) => {
          console.error('Error deleting leave request:', err);
          this.router.navigate(['/error', err.status]);
        },
      });
  }

  updateLeaveSlipStatus(leaveSlipId: number, status: LeaveSlip['status']): void {
    this.http
      .put<LeaveSlip>(
        `${environment.apiUrl}/leaverequest/${leaveSlipId}/${status.toUpperCase()}`,
        {}
      )
      .pipe(take(1))
      .subscribe({
        next: (updatedLeaveSlip) => {
          this.futureLeaves.update((leaves) =>
            leaves.map((l) => (l.id === leaveSlipId ? updatedLeaveSlip : l))
          );
          this.loadRemainingTime();
        },
        error: (err) => {
          console.error('Error updating leave request status:', err);
          this.router.navigate(['/error', err.status]);
        },
      });
  }
}
