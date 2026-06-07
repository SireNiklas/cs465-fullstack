import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Trip } from '../models/trip';
import { TripDataService } from '../trip-data.service';

@Component({
  selector: 'app-trip-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './trip-card.component.html',
  styleUrls: ['./trip-card.component.css']
})
export class TripCardComponent {
  @Input() trip!: Trip;
  @Output() tripDeleted = new EventEmitter<void>();

  constructor(private router: Router, private tripDataService: TripDataService) {}

  editTrip(trip: Trip): void {
    localStorage.setItem('tripCode', trip.code);
    this.router.navigate(['edit-trip']);
  }

  deleteTrip(tripCode: string): void {
    if (confirm('Delete this trip?')) {
      this.tripDataService.deleteTrip(tripCode).subscribe({
        next: () => this.tripDeleted.emit(),
        error: (err) => console.error('Delete failed', err)
      });
    }
  }
}
