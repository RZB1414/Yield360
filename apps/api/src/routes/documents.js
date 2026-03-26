import { uploadDocument, getDocumentById, deleteDocument, listDocumentsByPlanId } from '../lib/db.js';
import { jsonResponse } from '../lib/http.js';

export async function handleUploadDocumentRequest(request, env, planId) {
  const payload = await request.json();
  const timestamp = new Date().toISOString();
  const documentId = crypto.randomUUID();

  if (!payload.file_name || !payload.content_base64) {
    return jsonResponse({ message: 'Missing file details.' }, 400);
  }

  await uploadDocument(env.DB, {
    id: documentId,
    planId,
    fileName: payload.file_name,
    contentType: payload.content_type || 'application/pdf',
    contentBase64: payload.content_base64,
    createdAt: timestamp
  });

  return jsonResponse(
    {
      message: 'Document uploaded.',
      data: {
        id: documentId,
        fileName: payload.file_name,
        contentType: payload.content_type,
        createdAt: timestamp
      }
    },
    201
  );
}

export async function handleGetDocumentRequest(env, documentId) {
  const doc = await getDocumentById(env.DB, documentId);

  if (!doc) {
    return jsonResponse({ message: 'Document not found.' }, 404);
  }

  return jsonResponse({
    data: doc
  });
}

export async function handleDeleteDocumentRequest(env, documentId) {
  const doc = await getDocumentById(env.DB, documentId);

  if (!doc) {
    return jsonResponse({ message: 'Document not found.' }, 404);
  }

  await deleteDocument(env.DB, documentId);

  return jsonResponse({
    message: 'Document deleted.',
    data: {
      id: documentId
    }
  });
}

export async function handleListDocumentsRequest(env, planId) {
  const docs = await listDocumentsByPlanId(env.DB, planId);
  return jsonResponse({ data: docs });
}
