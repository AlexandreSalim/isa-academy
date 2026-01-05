import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AddEntryModalComponent } from './add-entry-modal.component';

describe('AddEntryModalComponent', () => {
  let component: AddEntryModalComponent;
  let fixture: ComponentFixture<AddEntryModalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [AddEntryModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AddEntryModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
