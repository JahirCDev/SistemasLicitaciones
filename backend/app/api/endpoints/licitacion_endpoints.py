from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile
from app.schemas.licitacion_schema import LicitacionCreate, LicitacionResponse
from app.services.licitacion_services import LicitacionService
from app.core.security import verify_token

router = APIRouter(prefix="/licitaciones", tags=["licitaciones"])

@router.post("", response_model=LicitacionResponse)
async def crear_licitacion(
    licitacion: LicitacionCreate,
    user_id: int = Depends(verify_token)
):
    return LicitacionService.crear_licitacion(licitacion, user_id)

@router.get("", response_model=list[LicitacionResponse])
async def listar_licitaciones(user_id: int = Depends(verify_token)):
    return LicitacionService.listar_licitaciones()

@router.get("/{licitacion_id}", response_model=LicitacionResponse)
async def obtener_licitacion(
    licitacion_id: int,
    user_id: int = Depends(verify_token)
):
    return LicitacionService.obtener_licitacion(licitacion_id)

@router.get("/{licitacion_id}/detalle")
async def obtener_detalle_licitacion(
    licitacion_id: int,
    user_id: int = Depends(verify_token)
):
    return LicitacionService.obtener_detalle(licitacion_id)

@router.get("/{licitacion_id}/historial-cambios")
async def obtener_historial_cambios(
    licitacion_id: int,
    user_id: int = Depends(verify_token)
):
    return LicitacionService.obtener_historial(licitacion_id)

@router.post("/{licitacion_id}/productos/{producto_id}")
async def agregar_producto(
    licitacion_id: int,
    producto_id: int,
    cantidad: int = Query(..., gt=0),
    user_id: int = Depends(verify_token)
):
    LicitacionService.agregar_producto(licitacion_id, producto_id, cantidad)
    return {"message": "Producto agregado exitosamente"}

@router.delete("/{licitacion_id}/productos/{producto_id}")
async def remover_producto(
    licitacion_id: int,
    producto_id: int,
    user_id: int = Depends(verify_token)
):
    return LicitacionService.remover_producto(licitacion_id, producto_id)

@router.post("/{licitacion_id}/documento")
async def subir_documento(
    licitacion_id: int,
    file: UploadFile,
    user_id: int = Depends(verify_token)
):
    from app.models.db import get_db
    
    db = get_db()
    try:
        content = await file.read()
        file_path = f"licitaciones/{licitacion_id}/{file.filename}"
        db.storage.from_("propuestas").upload(file_path, content)
        url = db.storage.from_("propuestas").get_public_url(file_path)
        
        LicitacionService.subir_documento(licitacion_id, file_path, url)
        return {"message": "Documento subido", "url": url}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{licitacion_id}/enviar")
async def enviar_licitacion(
    licitacion_id: int,
    user_id: int = Depends(verify_token)
):
    return LicitacionService.enviar_licitacion(licitacion_id, user_id)

@router.post("/{licitacion_id}/marcar-finalizada")
async def marcar_finalizada(
    licitacion_id: int,
    user_id: int = Depends(verify_token)
):
    return LicitacionService.cambiar_estado(licitacion_id, "finalizada", "activa", user_id)

@router.post("/{licitacion_id}/marcar-perdida")
async def marcar_perdida(
    licitacion_id: int,
    user_id: int = Depends(verify_token)
):
    return LicitacionService.cambiar_estado(licitacion_id, "perdida", "activa", user_id)

@router.post("/{licitacion_id}/marcar-por-cobrar")
async def marcar_por_cobrar(
    licitacion_id: int,
    user_id: int = Depends(verify_token)
):
    return LicitacionService.cambiar_estado(licitacion_id, "por_cobrar", "finalizada", user_id)

@router.post("/{licitacion_id}/registrar-pago")
async def registrar_pago(
    licitacion_id: int,
    monto: float = Query(..., gt=0),
    user_id: int = Depends(verify_token)
):
    return LicitacionService.registrar_pago(licitacion_id, monto, user_id)