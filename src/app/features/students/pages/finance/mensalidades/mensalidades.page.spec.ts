import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MensalidadesPage } from './mensalidades.page';

describe('MensalidadesPage', () => {
  let component: MensalidadesPage;
  let fixture: ComponentFixture<MensalidadesPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(MensalidadesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
