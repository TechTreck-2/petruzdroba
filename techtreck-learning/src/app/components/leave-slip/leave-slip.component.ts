import { Component, inject, OnInit } from '@angular/core';
import { LeaveSlipPickerComponent } from './leave-slip-picker/leave-slip-picker.component';
import { LeaveSlipService } from '../../service/leave-slip.service';
import { LeaveSlip } from '../../model/leave-slip.interface';
import { LeaveSlipTableComponent } from './leave-slip-table/leave-slip-table.component';
import { ProgressBarComponent } from '../../shared/progress-bar/progress-bar.component';
import { DatePipe } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { UserDataService } from '../../service/user-data.service';

@Component({
  selector: 'app-leave-slip',
  standalone: true,
  imports: [
    LeaveSlipPickerComponent,
    LeaveSlipTableComponent,
    ProgressBarComponent,
    DatePipe,
    MatTabsModule,
  ],
  templateUrl: './leave-slip.component.html',
  styleUrl: './leave-slip.component.css',
})
export class LeaveSlipComponent implements OnInit {
  protected leaveSlipService = inject(LeaveSlipService);
  protected userDataService = inject(UserDataService);

  ngOnInit(): void {
    this.leaveSlipService.loadLeaveSlips();
  }

  get leaveTime() {
    return new Date(this.leaveSlipService.remainingTime());
  }

  get futureLeaves() {
    return this.leaveSlipService.futureLeaves$();
  }

  get pastLeaves() {
    return this.leaveSlipService.pastLeaves$();
  }

  get remainingTime() {
    return this.leaveSlipService.remainingTime();
  }

  addLeave(leaveData: Omit<LeaveSlip, 'id'>) {
    this.leaveSlipService.addLeaveSlip(leaveData);
  }

  deleteLeave(leaveSlipId: number) {
    this.leaveSlipService.deleteLeaveSlip(leaveSlipId);
  }

  editLeave([oldVacation, newVacation]: [LeaveSlip, LeaveSlip]) {
    this.leaveSlipService.updateLeaveSlip(newVacation);
  }

  get personalTime(){
    return this.userDataService.user().personalTime;
  }
}
