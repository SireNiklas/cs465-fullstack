import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { TripDataService } from '../trip-data.service';

@Component({
  selector: 'app-edit-trip',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './edit-trip.component.html',
  styleUrls: ['./edit-trip.component.css']
})
export class EditTripComponent implements OnInit {
  editForm!: FormGroup;
  submitted = false;
  tripCode!: string;

  constructor(private fb: FormBuilder, private router: Router, private tripDataService: TripDataService) {}

  ngOnInit(): void {
    this.tripCode = localStorage.getItem('tripCode') || '';
    this.editForm = this.fb.group({
      code:        ['', Validators.required],
      name:        ['', Validators.required],
      length:      ['', Validators.required],
      start:       ['', Validators.required],
      resort:      ['', Validators.required],
      perPerson:   ['', Validators.required],
      image:       ['', Validators.required],
      description: ['', Validators.required],
    });
    this.tripDataService.getTrip(this.tripCode).subscribe({
      next: (trips) => {
        if (trips && trips.length > 0) {
          const t = trips[0];
          this.editForm.patchValue({
            code: t.code, name: t.name, length: t.length, start: t.start,
            resort: t.resort, perPerson: t.perPerson, image: t.image, description: t.description,
          });
        }
      },
      error: (err) => console.error('Could not load trip', err)
    });
  }

  get f() { return this.editForm.controls; }

  onSubmit(): void {
    this.submitted = true;
    if (this.editForm.invalid) return;
    this.tripDataService.updateTrip(this.tripCode, this.editForm.value).subscribe({
      next: () => this.router.navigate(['']),
      error: (err) => console.error('Update failed', err)
    });
  }
}
