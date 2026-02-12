import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { ManagerService } from '../../../service/manager.service';
import { LeaveWithUser } from '../../../model/manager-data.interface';
import { DateFilter } from '../../../model/date-filter.interface';
import { StatusFilter } from '../../../model/status-filter.interface';
import { CommonModule } from '@angular/common';
import { DateFilterComponent } from '../../../shared/date-filter/date-filter.component';
import { StatusFilterComponent } from '../../../shared/status-filter/status-filter.component';

@Component({
  selector: 'app-manager-leaves',
  standalone: true,
  imports: [CommonModule, DateFilterComponent, StatusFilterComponent],
  templateUrl: './manager-leaves.component.html',
  styleUrl: './manager-leaves.component.css',
})
export class ManagerLeavesComponent implements OnInit {
  private managerService = inject(ManagerService);
  private cdr = inject(ChangeDetectorRef);

  pendingLeaves: LeaveWithUser[] = [];
  completedLeaves: LeaveWithUser[] = [];

  private userEmailCache = new Map<number, string>();
  private remainingTimeCache = new Map<number, number>();
  private validLeaveCache = new Map<string, boolean>();

  private dateFilterPending: DateFilter = { startDate: new Date(0), endDate: new Date(0) };
  private dateFilterCompleted: DateFilter = { startDate: new Date(0), endDate: new Date(0) };
  private statusFilter: StatusFilter = { status: 'all' };

  async ngOnInit(): Promise<void> {
    await this.managerService.initialize();
    await this.refreshLeaves();
    await this.preloadUserData();
  }

  private async preloadUserData() {
    const allLeaves = [...this.pendingLeaves, ...this.completedLeaves];
    const userIds = new Set(allLeaves.map(l => l.userId));

    for (const userId of userIds) {
      if (!this.userEmailCache.has(userId)) {
        const user = this.managerService.getUserById(userId);
        if (user) {
          this.userEmailCache.set(userId, user.email);
        }
      }
    }

    for (const l of this.pendingLeaves) {
      if (!this.remainingTimeCache.has(l.userId)) {
        try {
          const remaining = await this.managerService.getRemainingTime(l.userId);
          this.remainingTimeCache.set(l.userId,remaining);

          const duration = new Date(l.leaveSlip.endTime).getTime() - new Date(l.leaveSlip.startTime).getTime();
          console.log(l.leaveSlip.id, 'duration:', duration, 'remaining:', remaining);
          const cacheKey = `${l.userId}-${l.leaveSlip.id}`;
          this.validLeaveCache.set(cacheKey, remaining >= duration);
        } catch (err) {
          console.error('Error fetching remaining time:', err);
        }
      }
    }

    this.cdr.markForCheck();
  }

  private get statusFilteredCompleted() {
    if (this.statusFilter.status === 'all') return this.completedLeaves;
    return this.completedLeaves.filter(l => l.leaveSlip.status === this.statusFilter.status);
  }

  get filteredCompletedLeaveRequests() {
    const filtered = this.statusFilteredCompleted;
    if (!this.dateFilterCompleted.startDate.getTime() && !this.dateFilterCompleted.endDate.getTime()) {
      return filtered;
    }
    return filtered.filter(l => {
      const start = new Date(l.leaveSlip.date).getTime();
      const from = this.dateFilterCompleted.startDate.getTime();
      const to = this.dateFilterCompleted.endDate.getTime() + 86400000;
      return start >= from && start < to;
    });
  }

  private get pendingLeaveRequests() {
    return this.pendingLeaves.filter(l => l.leaveSlip.status === 'pending' || l.leaveSlip.status === 'PENDING');
  }

  get filteredPendingLeaveRequests() {
    const filtered = this.pendingLeaveRequests;
    if (!this.dateFilterPending.startDate.getTime() && !this.dateFilterPending.endDate.getTime()) {
      return filtered;
    }
    return filtered.filter(l => {
      const start = new Date(l.leaveSlip.date).getTime();
      const from = this.dateFilterPending.startDate.getTime();
      const to = this.dateFilterPending.endDate.getTime() + 86400000;
      return start >= from && start < to;
    });
  }

  onChangeDateFilterPending(newDateFilter: DateFilter) {
    this.dateFilterPending = newDateFilter.startDate && newDateFilter.endDate
      ? newDateFilter
      : { startDate: new Date(0), endDate: new Date(0) };
  }

  onChangeDateFilterCompleted(newDateFilter: DateFilter) {
    this.dateFilterCompleted = newDateFilter.startDate && newDateFilter.endDate
      ? newDateFilter
      : { startDate: new Date(0), endDate: new Date(0) };
  }

  onChangeStatusFilter(newStatusFilter: StatusFilter) {
    this.statusFilter.status = newStatusFilter.status;
  }

  isValidLeave(l: LeaveWithUser): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const leaveDate = new Date(l.leaveSlip.date);
    leaveDate.setHours(0, 0, 0, 0);

    if (leaveDate < today) return false;

    const cacheKey = `${l.userId}-${l.leaveSlip.id}`;
    return this.validLeaveCache.get(cacheKey) ?? true;
  }

  getValidationMessage(l: LeaveWithUser): string {
    return this.isValidLeave(l) ? 'Accept' : 'Insufficient leave time';
  }

  getUserEmail(userId: number): string {
    if (this.userEmailCache.has(userId)) {
      return this.userEmailCache.get(userId)!;
    }

    const user = this.managerService.getUserById(userId);
    if (user) {
      this.userEmailCache.set(userId, user.email);
      return user.email;
    }

    return 'Loading...';
  }

  disabled(l: LeaveWithUser): boolean {
    return this.managerService.getLeaveIndex(l) === -1;
  }

  async onAccept(l: LeaveWithUser) {
    try {
      await this.managerService.acceptLeave(l);
      await this.refreshLeaves();
      await this.preloadUserData();
    } catch (err) {
      console.error('Error accepting leave:', err);
    }
  }

  async onDeny(l: LeaveWithUser) {
    try {
      await this.managerService.rejectLeave(l);
      await this.refreshLeaves();
      await this.preloadUserData();
    } catch (err) {
      console.error('Error denying leave:', err);
    }
  }

  async onUndo(l: LeaveWithUser) {
    try {
      await this.managerService.undoLeave(l);
      await this.refreshLeaves();
      await this.preloadUserData();
    } catch (err) {
      console.error('Error undoing leave:', err);
    }
  }

  private async refreshLeaves() {
    await this.managerService.initialize();
    this.pendingLeaves = this.managerService.pendingLeavesComputed();
    this.completedLeaves = this.managerService.completedLeavesComputed();
  }
}
