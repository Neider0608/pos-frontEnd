import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WhatsappMultiagentComponent } from './whatsapp-multiagent.component';

describe('WhatsappMultiagentComponent', () => {
  let component: WhatsappMultiagentComponent;
  let fixture: ComponentFixture<WhatsappMultiagentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WhatsappMultiagentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WhatsappMultiagentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
