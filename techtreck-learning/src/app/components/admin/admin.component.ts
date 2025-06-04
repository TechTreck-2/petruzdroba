import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../service/admin.service';
import { UserData } from '../../model/user-data.interface';
import { EditUserComponent } from './edit-user/edit-user.component';
import { MatAccordion, MatExpansionModule } from '@angular/material/expansion';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    FormsModule,
    EditUserComponent,
    MatExpansionModule,
    MatAccordion,
  ],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.sass',
})
export class AdminComponent implements OnInit {
  private adminService = inject(AdminService);

  adminData: UserData[] = [];
  protected searchText: string = '';
  protected filteredUsers = signal<UserData[]>([]);

  protected isOpenEdit: boolean = false;
  protected selectedUser: UserData | null = null;

  async ngOnInit(): Promise<void> {
    await this.adminService.initialize();
    this.adminData = this.adminService
      .getAdminData()
      .filter((user) => user.role !== 'admin');
    this.filterUsers();
  }

  protected filterUsers() {
    if (!this.searchText) {
      this.filteredUsers.set(this.adminData);
      return;
    }

    const filtered = this.adminData.filter((user) =>
      user.email.toLowerCase().includes(this.searchText.toLowerCase())
    );
    this.filteredUsers.set(filtered);
  }

  openEditWindow(user: UserData) {
    this.isOpenEdit = true;
    this.selectedUser = user;
  }

  async closeEditWindow() {
    await this.adminService.initialize();
    this.adminData = this.adminService
      .getAdminData()
      .filter((user) => user.role !== 'admin');
    this.filterUsers();

    this.isOpenEdit = false;
    this.selectedUser = null;
  }
}
