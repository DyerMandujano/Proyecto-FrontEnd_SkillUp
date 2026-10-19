import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AdminService } from './admin.service';
import { SolicitudPagoResponse, UsuarioAdmin } from '../models/admin.models';

describe('AdminService (Pruebas Unitarias Frontend)', () => {
  let service: AdminService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AdminService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(AdminService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('HU17: Debe listar solicitudes de pago con el filtro correspondiente', () => {
    const mockPagos: SolicitudPagoResponse[] = [
      { id_solicitud: 1, id_estudiante: 10, num_operacion: 'OP-123', monto: 100, metodo_pago: 'BCP', estado: 'Pendiente' }
    ];

    service.listarSolicitudesPago('Pendiente').subscribe(data => {
      expect(data.length).toBe(1);
      expect(data[0].num_operacion).toBe('OP-123');
    });

    const req = httpMock.expectOne('/api/admin/solicitudes-pago?estado=Pendiente');
    expect(req.request.method).toBe('GET');
    req.flush(mockPagos);
  });

  it('HU17: Debe enviar solicitud de aprobación PUT /aprobar', () => {
    service.aprobarSolicitudPago(1).subscribe(res => {
      expect(res).toBeTruthy();
    });

    const req = httpMock.expectOne('/api/admin/solicitudes-pago/1/aprobar');
    expect(req.request.method).toBe('PUT');
    req.flush({ id_solicitud: 1, estado: 'Aprobado' });
  });

  it('HU17: Debe enviar observación al rechazar una solicitud', () => {
    const observacion = 'Voucher no visible';

    service.rechazarSolicitudPago(1, observacion).subscribe(res => {
      expect(res).toBeTruthy();
    });

    const req = httpMock.expectOne('/api/admin/solicitudes-pago/1/rechazar');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ observacion });
    req.flush({ id_solicitud: 1, estado: 'Rechazado' });
  });

  it('HU18: Debe cambiar el estado de un usuario (baja lógica / reactivación)', () => {
    service.cambiarEstadoUsuario(5, 0).subscribe(res => {
      expect(res.estado).toBe(0);
    });

    const req = httpMock.expectOne('/api/admin/usuarios/5/estado?nuevoEstado=0');
    expect(req.request.method).toBe('PUT');
    req.flush({ id_usuario: 5, estado: 0 });
  });
});
