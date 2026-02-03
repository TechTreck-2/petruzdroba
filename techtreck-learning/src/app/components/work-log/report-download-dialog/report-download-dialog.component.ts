import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EditBoxComponent } from '../../../shared/edit-box/edit-box.component';

@Component({
  selector: 'app-report-download-dialog',
  standalone: true,
  imports: [CommonModule, EditBoxComponent],
  templateUrl: './report-download-dialog.component.html',
  styleUrl: './report-download-dialog.component.css',
})
export class ReportDownloadDialogComponent {
  @Input({ required: true }) isOpen!: boolean;
  @Output() closeWindow = new EventEmitter<void>();
  @Output() downloadSelected = new EventEmitter<void>();
  @Output() emailSelected = new EventEmitter<void>();

  downloadLocally() {
    this.downloadSelected.emit();
  }

  sendToEmail() {
    this.emailSelected.emit();
  }

  onClose() {
    this.closeWindow.emit();
  }
}
