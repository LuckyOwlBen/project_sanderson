import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { LogsView } from './logs-view';

describe('LogsView', () => {
  let fixture: ComponentFixture<LogsView>;
  let component: LogsView;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LogsView, HttpClientTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(LogsView);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    component.ngOnDestroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('initializes with ReplaySubject', () => {
    expect(component.vm$).toBeTruthy();
  });
});
