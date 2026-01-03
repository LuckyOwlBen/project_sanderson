import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { TalentView } from './talent-view';
import { CharacterStateService } from '../../character/characterStateService';
import { WebsocketService } from '../../services/websocket.service';
import { MatDialogModule } from '@angular/material/dialog';
import { StepValidationService } from '../../services/step-validation.service';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('TalentView', () => {
  let component: TalentView;
  let fixture: ComponentFixture<TalentView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TalentView, MatDialogModule, BrowserAnimationsModule],
      providers: [
        CharacterStateService,
        WebsocketService,
        StepValidationService,
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: of({})
          }
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TalentView);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
