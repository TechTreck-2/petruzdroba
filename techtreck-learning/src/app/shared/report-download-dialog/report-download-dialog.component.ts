import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EditBoxComponent } from '../edit-box/edit-box.component';

@Component({
  selector: 'app-report-download-dialog',
  standalone: true,
  imports: [CommonModule, EditBoxComponent, FormsModule],
  templateUrl: './report-download-dialog.component.html',
  styleUrl: './report-download-dialog.component.css',
})
export class ReportDownloadDialogComponent {
  @Input({ required: true }) isOpen!: boolean;
  @Output() closeWindow = new EventEmitter<void>();
  @Output() downloadSelected = new EventEmitter<{ month: number; year: number }>();
  @Output() emailSelected = new EventEmitter<{ month: number; year: number }>();

  selectedMonth = signal(new Date().getMonth() + 1);
  selectedYear = signal(new Date().getFullYear());

  months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  monthDisabled(monthIndex: number): boolean {
    const currentDate = new Date();
    const selectedDate = new Date(this.selectedYear(), monthIndex, 1);
    return selectedDate > currentDate;
  }

  downloadLocally() {
    this.downloadSelected.emit({
      month: this.selectedMonth(),
      year: this.selectedYear(),
    });
  }

  sendToEmail() {
    this.emailSelected.emit({
      month: this.selectedMonth(),
      year: this.selectedYear(),
    });
  }

  onClose() {
    this.closeWindow.emit();
  }
}
