import { uploadDocument, getDocumentById, deleteDocument, listDocumentsByPlanId } from '../lib/db.js';
import { jsonResponse } from '../lib/http.js';

const maxDocumentBytes = 10 * 1024 * 1024;

function getDocumentsBucket(env) {
  return env.DOCUMENTS_BUCKET?.put && env.DOCUMENTS_BUCKET?.get ? env.DOCUMENTS_BUCKET : null;
}

function stripDataUrlPrefix(value) {
  return String(value ?? '').replace(/^data:[^;]+;base64,/, '');
}

function normalizeFileName(value) {
  return String(value ?? 'documento.pdf')
    .trim()
    .replace(/[^\w. -]+/g, '-')
    .slice(0, 120) || 'documento.pdf';
}

function decodeBase64ToBytes(value) {
  const base64 = stripDataUrlPrefix(value);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function encodeBytesToBase64(bytes) {
  let binary = '';
  const chunkSize = 0x8000;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }

  return btoa(binary);
}

export async function handleUploadDocumentRequest(request, env, planId) {
  const payload = await request.json();
  const timestamp = new Date().toISOString();
  const documentId = crypto.randomUUID();
  const contentType = payload.content_type || 'application/pdf';
  const fileName = normalizeFileName(payload.file_name);

  if (!payload.file_name || !payload.content_base64) {
    return jsonResponse({ message: 'Missing file details.' }, 400);
  }

  if (contentType !== 'application/pdf' || !fileName.toLowerCase().endsWith('.pdf')) {
    return jsonResponse({ message: 'Only PDF documents are supported.' }, 400);
  }

  const fileBytes = decodeBase64ToBytes(payload.content_base64);

  if (fileBytes.byteLength > maxDocumentBytes) {
    return jsonResponse({ message: 'Document exceeds the 10 MB upload limit.' }, 413);
  }

  const bucket = getDocumentsBucket(env);
  const objectKey = `plans/${planId}/documents/${documentId}/${fileName}`;

  if (bucket) {
    await bucket.put(objectKey, fileBytes, {
      httpMetadata: {
        contentType
      },
      customMetadata: {
        planId,
        documentId,
        fileName
      }
    });
  }

  await uploadDocument(env.DB, {
    id: documentId,
    planId,
    fileName,
    contentType,
    objectKey: bucket ? objectKey : null,
    objectSize: fileBytes.byteLength,
    contentBase64: bucket ? '' : payload.content_base64,
    createdAt: timestamp
  });

  return jsonResponse(
    {
      message: 'Document uploaded.',
      data: {
        id: documentId,
        fileName,
        contentType,
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

  if (doc.objectKey) {
    const bucket = getDocumentsBucket(env);

    if (!bucket) {
      return jsonResponse({ message: 'Document storage bucket is not configured.' }, 503);
    }

    const object = await bucket.get(doc.objectKey);

    if (!object) {
      return jsonResponse({ message: 'Document object not found.' }, 404);
    }

    const bytes = new Uint8Array(await object.arrayBuffer());
    const contentType = doc.contentType || object.httpMetadata?.contentType || 'application/pdf';

    return jsonResponse({
      data: {
        ...doc,
        contentType,
        contentBase64: `data:${contentType};base64,${encodeBytesToBase64(bytes)}`
      }
    });
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

  if (doc.objectKey) {
    const bucket = getDocumentsBucket(env);
    await bucket?.delete(doc.objectKey);
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
