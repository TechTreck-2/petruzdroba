import { Component, inject } from '@angular/core';
import { WorkLogService } from '../../../service/work-log.service';
import { VacationService } from '../../../service/vacation.service';
import { DatePipe } from '@angular/common';
import { getDaysBetweenDates } from '../../../shared/utils/time.utils';

@Component({
  selector: 'app-days-info',
  standalone: true,
  imports: [],
  providers: [DatePipe],
  templateUrl: './days-info.component.html',
  styleUrl: './days-info.component.css',
})
export class DaysInfoComponent {
  private workLogService = inject(WorkLogService);
  private vacationService = inject(VacationService);
  private datePipe = inject(DatePipe);

  get daysNotLoggedIn() {
    const today = new Date();
    let unworkedDays: number = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      0
    ).getDate(); //nr of days in this month
    let weekends = 0;
    for (let index = 1; index <= unworkedDays; index++) {
      if (
        new Date(index, today.getMonth(), today.getFullYear()).getDay() === 0 ||
        new Date(index, today.getMonth(), today.getFullYear()).getDay() === 6
      ) {
        weekends++;
      }
    }
    unworkedDays -= weekends;
    this.workLogService.getWorkLog.forEach((session) => {
      const dateA = new Date(session.date);
      if (
        dateA.getMonth() === today.getMonth() &&
        dateA.getFullYear() === today.getFullYear() &&
        dateA.getDate() <= today.getDate()
      ) {
        if (session.timeWorked >= 600000) {
          //at least 20 minutes in the day worked
          unworkedDays--;
        }
      }
    });
    unworkedDays -= this.vacationsPastThisMonth; //days vacationed are paid
    return unworkedDays;
  }

  get vacationsPastThisMonth() {
    const today = new Date();
    let vacationDays = 0;

    // Combine past and future vacations and process them
    const allVacations = [
      ...this.vacationService.pastVacations,
      ...this.vacationService.futureVacations,
    ];

    allVacations
      .filter((vacation) => vacation.status === 'accepted')
      .forEach((vacation) => {
        const startDate = new Date(vacation.startDate);
        const endDate = new Date(vacation.endDate);

        // Check if vacation is in current month and year
        if (
          startDate.getMonth() === today.getMonth() &&
          startDate.getFullYear() === today.getFullYear()
        ) {
          // If vacation ends after this month, cap it at month end
          const monthEnd = new Date(
            today.getFullYear(),
            today.getMonth() + 1,
            0
          );
          const effectiveEndDate = endDate > monthEnd ? monthEnd : endDate;

          vacationDays += getDaysBetweenDates(startDate, effectiveEndDate);
        }
      });

    return vacationDays;
  }

  get remainingVacationDays() {
    return this.vacationService.remainingDays;
  }

  get nextVacation() {
    const newArr = this.vacationService.futureVacations.sort((a, b) => {
      const dateA = new Date(a.startDate).getTime();
      const dateB = new Date(b.startDate).getTime();
      return dateA - dateB;
    });

    for (let vacation of newArr) {
      if (vacation.status === 'accepted') {
        const startDate = new Date(vacation.startDate);
        const endDate = new Date(vacation.endDate);
        if (startDate.getTime() === endDate.getTime()) {
          return (
            this.datePipe.transform(startDate, 'EEE, MMMM d, y') + ' (1 day)'
          );
        } else {
          return (
            this.datePipe.transform(startDate, 'EEE, MMMM d, y') +
            '   ->   ' +
            this.datePipe.transform(endDate, 'EEE, MMMM d, y') +
            ` (${getDaysBetweenDates(startDate, endDate)} days)`
          );
        }
      }
    }

    return '-';
  }
}
