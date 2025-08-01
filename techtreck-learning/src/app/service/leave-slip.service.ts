import {
  computed,
  effect,
  inject,
  Injectable,
  OnDestroy,
  signal,
} from '@angular/core';
import { LeaveSlip } from '../model/leave-slip.interface';
import { LeaveSlipData } from '../model/leaveslip-data.interface';
import { HttpClient } from '@angular/common/http';
import { take } from 'rxjs';
import { UserDataService } from './user-data.service';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class LeaveSlipService implements OnDestroy {
  private userData = inject(UserDataService);
  private routerService = inject(Router);
  private http = inject(HttpClient);
  private subscription: any;

  private leaveSlipData = signal<LeaveSlipData>({
    futureLeaves: [],
    pastLeaves: [],
    remainingTime: 21600000, // 6 hours (21600000ms = 6h × 60m × 60s × 1000ms)
  });

  constructor() {
    effect(
      () => {
        this.initialize();
      },
      { allowSignalWrites: true }
    );
  }

  initialize(): void {
    if (this.userData.isLoggedIn()) {
      this.http
        .get<LeaveSlipData>(
          `${environment.apiUrl}/leaveslip/get/${this.userData.user().id}/`
        )
        .pipe(take(1))
        .subscribe({
          next: (res) => {
            const processedData = this.processExpiredLeaves(res);
            this.leaveSlipData.set(processedData);
            this.updateLeaveData();
          },
          error: (err) => {
            console.error('Error fetching vacation data:', err);
          },
        });
    }
  }

  private processExpiredLeaves(data: LeaveSlipData): LeaveSlipData {
    const today = new Date();
    let futureLeaves = data.futureLeaves || [];
    let pastLeaves = data.pastLeaves || [];

    futureLeaves = futureLeaves.filter((leave) => {
      if (new Date(leave.date) < today) {
        if (leave.status === 'pending') {
          leave.status = 'ignored';
        }
        pastLeaves.push(leave);
        return false; // Remove from future
      }
      return true; // Keep in future
    });

    return {
      futureLeaves,
      pastLeaves,
      remainingTime: data.remainingTime,
    };
  }

  private readonly remainingTimeSignal = computed(
    () => this.leaveSlipData().remainingTime
  );
  private readonly pastLeavesSignal = computed(
    () => this.leaveSlipData().pastLeaves
  );
  private readonly futureLeavesSignal = computed(
    () => this.leaveSlipData().futureLeaves
  );

  private readonly _leaveSlipData = computed(() => this.leaveSlipData());

  get remainingTime(): number {
    return this.remainingTimeSignal();
  }

  get pastLeaves(): LeaveSlip[] {
    return this.pastLeavesSignal();
  }

  get futureLeaves(): LeaveSlip[] {
    return this.futureLeavesSignal();
  }

  get leaveSlip(): LeaveSlipData {
    return this._leaveSlipData();
  }

  addLeave(leaveData: LeaveSlip) {
    this.leaveSlipData.update((currentData) => ({
      ...currentData,
      futureLeaves: [...currentData.futureLeaves, leaveData],
    }));
    this.updateLeaveData();
  }

  restoreLeaveTime(index: number) {
    this.leaveSlipData.update((currentData) => {
      if (currentData.futureLeaves[index].status === 'accepted') {
        const dateA = new Date(currentData.futureLeaves[index].startTime);
        const dateB = new Date(currentData.futureLeaves[index].endTime);
        return {
          ...currentData,
          remainingTime:
            currentData.remainingTime + (dateB.getTime() - dateA.getTime()),
        };
      }
      return currentData;
    });
    this.updateLeaveData();
  }

  deleteLeave(index: number, tableType: 'future' | 'past') {
    this.leaveSlipData.update((currentData) => {
      if (tableType === 'future') {
        this.restoreLeaveTime(index);
        return {
          ...currentData,
          futureLeaves: [
            ...currentData.futureLeaves.slice(0, index),
            ...currentData.futureLeaves.slice(index + 1),
          ],
        };
      } else {
        return {
          ...currentData,
          pastLeaves: [
            ...currentData.pastLeaves.slice(0, index),
            ...currentData.pastLeaves.slice(index + 1),
          ],
        };
      }
    });
    this.updateLeaveData();
  }

  editLeaveSlip(oldLeave: LeaveSlip, newLeaveData: LeaveSlip) {
    const currentData = this.leaveSlipData();
    const index = this.findLeaveIndex(oldLeave);

    if (index !== -1) {
      this.restoreLeaveTime(index);
      const updatedLeaves = [...currentData.futureLeaves];
      updatedLeaves[index] = { ...newLeaveData, status: 'pending' };

      this.leaveSlipData.set({
        ...currentData,
        futureLeaves: updatedLeaves,
      });
      this.updateLeaveData();
    }
  }

  findLeaveIndex(leave: LeaveSlip): number {
    return this.leaveSlipData().futureLeaves.findIndex(
      (item) =>
        new Date(item.date).getTime() === new Date(leave.date).getTime() &&
        item.description === leave.description
    );
  }

  updateLeaveData() {
    if (this.userData.isLoggedIn()) {
      this.subscription = this.http
        .put(`${environment.apiUrl}/leaveslip/update/`, {
          userId: this.userData.user().id,
          data: this.leaveSlipData(),
        })
        .subscribe({
          next: (res) => {},
          error: (err) => {
            //this is for server eror handling
            this.routerService.navigate(['/error', err.status]);
          },
        });
    }
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
