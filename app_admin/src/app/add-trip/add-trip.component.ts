import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { TripDataService } from '../trip-data.service';

@Component({
  selector: 'app-add-trip',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './add-trip.component.html',
  styleUrls: ['./add-trip.component.css']
})
export class AddTripComponent implements OnInit {
  addForm!: FormGroup;
  submitted = false;

  constructor(private fb: FormBuilder, private router: Router, private tripDataService: TripDataService) {}

  ngOnInit(): void {
    this.addForm = this.fb.group({
      code:        ['', Validators.required],
      name:        ['', Validators.required],
      length:      ['', Validators.required],
      start:       ['', Validators.required],
      resort:      ['', Validators.required],
      perPerson:   ['', Validators.required],
      image:       ['', Validators.required],
      description: ['', Validators.required],
    });
  }

  get f() { return this.addForm.controls; }

  onSubmit(): void {
    this.submitted = true;
    if (this.addForm.invalid) return;
    this.tripDataService.addTrip(this.addForm.value).subscribe({
      next: () => this.router.navigate(['']),
      error: (err) => console.error('Add trip failed', err)
    });
  }
}
