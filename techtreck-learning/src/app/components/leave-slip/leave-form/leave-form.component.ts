import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { provideNativeDateAdapter } from '@angular/material/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSelectModule } from '@angular/material/select';
import { CommonModule } from '@angular/common';
import { LeaveSlipService } from '../../../service/leave-slip.service';
import { LeaveSlip } from '../../../model/leave-slip.interface';
import {
  transformDateToTimeString,
  validateTimeRangeString,
  combineDateAndTime
} from '../../../shared/utils/time.utils';

@Component({
  selector: 'app-leave-form',
  standalone: true,
  providers: [provideNativeDateAdapter()],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatSelectModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './leave-form.component.html',
  styleUrl: './leave-form.component.css',
})
export class LeaveFormComponent implements OnInit, OnChanges {
  @Input({ required: true }) leaveSlip!: LeaveSlip | null;
  @Output() closeEditWindow = new EventEmitter<void>();
  @Output() leaveAdded = new EventEmitter<Omit<LeaveSlip, 'id'>>();
  @Output() leaveEdited = new EventEmitter<[LeaveSlip, LeaveSlip]>();

  private leaveSlipService = inject(LeaveSlipService);

  protected form = new FormGroup({
    startTime: new FormControl<string>('', {
      validators: Validators.required,
    }),
    endTime: new FormControl<string>('', {
      validators: Validators.required,
    }),
    date: new FormControl<Date | null>(null, {
      validators: Validators.required,
    }),
    description: new FormControl<string>('', {
      validators: [Validators.required, Validators.maxLength(10)],
    }),
    reason: new FormControl<string>('', {
      validators: [Validators.maxLength(40)],
    }),
  });

  ngOnInit(): void {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['leaveSlip'] && this.leaveSlip?.date) {
      this.form.patchValue({
        startTime: transformDateToTimeString(this.leaveSlip.startTime),
        endTime: transformDateToTimeString(this.leaveSlip.endTime),
        date: new Date(this.leaveSlip.date),
      });

      if (this.leaveSlip.description.includes('Other')) {
        this.form.patchValue({
          description: 'Other',
          reason: this.leaveSlip.description.replace('Other ', ''),
        });
      } else {
        this.form.patchValue({
          description: this.leaveSlip.description,
        });
      }
    }
  }

  myFilter = (d: Date | null): boolean => {
    const day = (d || new Date()).getDay();
    const today = new Date();
    let alreadyTaken: boolean = true;

    if (day != null && d != undefined && this.leaveSlip === null) {
      const futureLeaves = this.leaveSlipService.futureLeaves$();
      futureLeaves.forEach((leave) => {
        const leaveDate = new Date(leave.date);
        leaveDate.setHours(0, 0, 0, 0);
        const checkDate = new Date(d);
        checkDate.setHours(0, 0, 0, 0);

        if (
          checkDate.getTime() === leaveDate.getTime() &&
          leave.status !== 'denied' &&
          leave.status !== 'DENIED'
        ) {
          alreadyTaken = false;
        }
      });
    }

    return alreadyTaken && day !== 0 && day !== 6 && (d || new Date()) > today;
  };

  get descriptionLength(): number {
    return this.form.value.description?.length || 0;
  }

  get customDescription(): boolean {
    return this.form.value.description === 'Other';
  }

  get timeValidation(): boolean {
    if (this.form.value.startTime && this.form.value.endTime) {
      return validateTimeRangeString(
        this.form.value.startTime,
        this.form.value.endTime,
        this.leaveSlipService.remainingTime(),
      );
    }
    return false;
  }

  onSubmit() {
    if (this.form.invalid) {
      console.log('INVALID FORM');
      return;
    }

    if (
      this.form.value.startTime &&
      this.form.value.endTime &&
      this.form.value.description &&
      this.form.value.date
    ) {
      if (
        !validateTimeRangeString(
          this.form.value.startTime,
          this.form.value.endTime,
          this.leaveSlipService.remainingTime(),
        )
      ) {
        console.log(this.leaveSlipService.remainingTime());
        this.form.get('endTime')?.reset();
        return;
      }

      if (this.form.value.reason === null) {
        this.form.get('reason')?.setValue('');
      }

      const newLeaveSlip: LeaveSlip = {
        id: this.leaveSlip?.id,
        userId: this.leaveSlip?.userId,
        startTime: combineDateAndTime(
          this.form.value.date!,
          this.form.value.startTime!,
        ),
        endTime: combineDateAndTime(
          this.form.value.date!,
          this.form.value.endTime!,
        ),
        description: this.customDescription
          ? 'Other ' + this.form.value.reason
          : this.form.value.description,
        date: new Date(this.form.value.date!),
        status: this.leaveSlip?.status || 'pending',
      };

      if (this.leaveSlip !== null) {
        this.leaveEdited.emit([this.leaveSlip, newLeaveSlip]);
        this.closeEditWindow.emit();
      } else {
        this.leaveAdded.emit(newLeaveSlip);
      }
    }

    this.form.reset();
  }

  onReset() {
    if (this.leaveSlip !== null) {
      this.form.patchValue({
        startTime: transformDateToTimeString(this.leaveSlip.startTime),
        endTime: transformDateToTimeString(this.leaveSlip.endTime),
        date: new Date(this.leaveSlip.date),
      });

      if (this.leaveSlip.description.includes('Other')) {
        this.form.patchValue({
          description: 'Other',
          reason: this.leaveSlip.description.replace('Other ', ''),
        });
      } else {
        this.form.patchValue({
          description: this.leaveSlip.description,
        });
      }
    } else {
      this.form.reset();
    }
  }
}
