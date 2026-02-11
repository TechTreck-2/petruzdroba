import { inject, Injectable, signal, computed } from '@angular/core';
import { LeaveWithUser, ManagerData, VacationWithUser } from '../model/manager-data.interface';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { take, firstValueFrom } from 'rxjs';
import { Vacation } from '../model/vacation.interface';
import { UserData } from '../model/user-data.interface';
import { LeaveSlip } from '../model/leave-slip.interface';
import { environment } from '../../environments/environment';


@Injectable({ providedIn: 'root' })
export class ManagerService {
  private routerService = inject(Router);
  private http = inject(HttpClient);

  private allVacations = signal<Vacation[]>([]);
  private allLeaveSlips = signal<LeaveSlip[]>([]);

  private managerData = signal<ManagerData>({
    vacations: {},
    leaves: {},
  });

  private usersData = signal<{ [key: number]: UserData }>({});
  private pendingRequests = new Map<number, Promise<UserData>>();

  constructor() {
    this.fetchManagerData();
  }

  initialize(): Promise<void> {
    return this.fetchManagerData();
  }

  private fetchManagerData(): Promise<void> {
    return Promise.all([
      // Fetch vacations
      firstValueFrom(
        this.http.get<Vacation[]>(`${environment.apiUrl}/vacation`)
      ).then(
        (vacations) => {
          this.allVacations.set(vacations);
        },
        (err) => {
          this.routerService.navigate(['/error', err.status]);
          throw err;
        }
      ),
      // Fetch leave slips
      firstValueFrom(
        this.http.get<LeaveSlip[]>(`${environment.apiUrl}/leaverequest`)
      ).then(
        (leaveSlips) => {
          this.allLeaveSlips.set(leaveSlips);
        },
        (err) => {
          this.routerService.navigate(['/error', err.status]);
          throw err;
        }
      ),
    ]).then(() => {
      this.managerData.set({
        vacations: {},
        leaves: {},
      });
    });
  }

  readonly pendingVacationsComputed = computed(() => {
    return this.allVacations()
      .filter((v) => v.status === 'PENDING')
      .map((vacation) => ({
        userId: vacation.userId!,
        vacation,
      }));
  });

  readonly completedVacationsComputed = computed(() => {
    return this.allVacations()
      .filter((v) => v.status !== 'PENDING')
      .map((vacation) => ({
        userId: vacation.userId!,
        vacation,
      }));
  });

  readonly pendingLeavesComputed = computed(() => {
    return this.allLeaveSlips()
      .filter((l) => l.status === 'pending' || l.status === 'PENDING')
      .map((leaveSlip) => ({
        userId: leaveSlip.userId!,
        leaveSlip,
      }));
  });

  readonly completedLeavesComputed = computed(() => {
    return this.allLeaveSlips()
      .filter((l) => l.status !== 'pending' && l.status !== 'PENDING')
      .map((leaveSlip) => ({
        userId: leaveSlip.userId!,
        leaveSlip,
      }));
  });

  readonly futureLeaves = computed(() => {
    const now = new Date();
    const future = this.allLeaveSlips()
      .filter((l) => new Date(l.date) > now)
      .map((leaveSlip) => ({
        userId: leaveSlip.userId!,
        leaveSlip,
      }));
    return future;
  });

  readonly pastLeaves = computed(() => {
    const now = new Date();
    const past = this.allLeaveSlips()
      .filter((l) => new Date(l.date) <= now)
      .map((leaveSlip) => ({
        userId: leaveSlip.userId!,
        leaveSlip,
      }));
    return past;
  });

  acceptVacation(vacationWithUser: VacationWithUser): Promise<void> {
    return this.updateVacationStatus(vacationWithUser, 'ACCEPTED');
  }

  rejectVacation(vacationWithUser: VacationWithUser): Promise<void> {
    return this.updateVacationStatus(vacationWithUser, 'DENIED');
  }

  undoVacation(vacationWithUser: VacationWithUser): Promise<void> {
    return this.updateVacationStatus(vacationWithUser, 'PENDING');
  }

  private updateVacationStatus(
    vacationWithUser: VacationWithUser,
    status: string,
  ): Promise<void> {
    const { vacation } = vacationWithUser;
    if (!vacation.id) return Promise.reject('Vacation ID required');

    return new Promise((resolve, reject) => {
      this.http
        .put<Vacation>(
          `${environment.apiUrl}/vacation/${vacation.id}/${status}`,
          {},
        )
        .pipe(take(1))
        .subscribe({
          next: () => {
            this.fetchManagerData();
            resolve();
          },
          error: (err) => {
            console.error(err);
            this.routerService.navigate(['/error', err.status]);
            reject(err);
          },
        });
    });
  }

  acceptLeave(leaveSlipWithUser: LeaveWithUser): Promise<void> {
    return this.updateLeaveStatus(leaveSlipWithUser, 'accepted');
  }

  rejectLeave(leaveSlipWithUser: LeaveWithUser): Promise<void> {
    return this.updateLeaveStatus(leaveSlipWithUser, 'denied');
  }

  undoLeave(leaveSlipWithUser: LeaveWithUser): Promise<void> {
    return this.updateLeaveStatus(leaveSlipWithUser, 'pending');
  }

  private updateLeaveStatus(
    leaveSlipWithUser: LeaveWithUser,
    status: 'accepted' | 'denied' | 'pending',
  ): Promise<void> {
    const { leaveSlip } = leaveSlipWithUser;
    if (!leaveSlip.id) return Promise.reject('Leave slip ID required');

    return new Promise((resolve, reject) => {
      this.http
        .put<LeaveSlip>(
          `${environment.apiUrl}/leaverequest/${leaveSlip.id}/${status.toUpperCase()}`,
          {},
        )
        .pipe(take(1))
        .subscribe({
          next: () => {
            this.fetchManagerData();
            resolve();
          },
          error: (err) => {
            console.error(err);
            this.routerService.navigate(['/error', err.status]);
            reject(err);
          },
        });
    });
  }

  getRemainingDays(userId: number): Promise<number> {
    return firstValueFrom(
      this.http.get<number>(
        `${environment.apiUrl}/vacation/user/remaining/${userId}`,
      ),
    );
  }

  getRemainingTime(userId: number): Promise<number> {
    return firstValueFrom(
      this.http.get<number>(
        `${environment.apiUrl}/leaverequest/remaining/${userId}`,
      ),
    );
  }

  getUserById(userId: number): UserData | null {
    if (this.usersData()[userId]) return this.usersData()[userId];

    if (!this.pendingRequests.has(userId)) {
      const request = firstValueFrom(
        this.http.get<UserData>(`${environment.apiUrl}/user/${userId}`),
      )
        .then((res) => {
          this.usersData.update((state) => ({ ...state, [userId]: res }));
          this.pendingRequests.delete(userId);
          return res;
        })
        .catch((err) => {
          this.routerService.navigate(['/error', err.status]);
          this.pendingRequests.delete(userId);
          throw err;
        });

      this.pendingRequests.set(userId, request);
    }

    return null;
  }

  getVacationIndex(vacationWithUser: VacationWithUser): number {
    return -1;
  }

  getLeaveIndex(leaveSlipWithUser: LeaveWithUser): number {
    return -1;
  }
}
