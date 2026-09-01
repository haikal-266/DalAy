/**
 * Centralized User-Friendly Error Formatter & Sanitizer
 * Translates raw developer/system exceptions into polite, clear, and actionable messages.
 */

export const getFriendlyErrorMessage = (error, context = 'general', isIndonesian = true) => {
  if (!error) {
    return isIndonesian
      ? 'Terjadi kendala yang tidak diketahui. Silakan coba beberapa saat lagi.'
      : 'An unexpected issue occurred. Please try again shortly.';
  }

  const rawMessage = typeof error === 'string'
    ? error
    : (error.message || error.toString() || '');

  const lower = rawMessage.toLowerCase();

  // 1. Network / Internet Connection Errors
  if (
    lower.includes('unknownhostexception') ||
    lower.includes('no address associated with hostname') ||
    lower.includes('failed to fetch') ||
    lower.includes('network request failed') ||
    lower.includes('enotfound') ||
    lower.includes('econnrefused') ||
    lower.includes('internet') ||
    lower.includes('offline')
  ) {
    return isIndonesian
      ? 'Tidak ada koneksi internet. Pastikan perangkat Anda terhubung ke internet dan coba lagi.'
      : 'No internet connection. Please make sure your device is connected to the internet and try again.';
  }

  // 2. Timeout & Abort Errors
  if (
    lower.includes('request timeout') ||
    lower.includes('aborterror') ||
    lower.includes('fetch request has been canceled') ||
    lower.includes('canceled') ||
    lower.includes('timed out') ||
    lower.includes('timeout')
  ) {
    return isIndonesian
      ? 'Waktu pemrosesan habis karena koneksi lambat atau tidak stabil. Silakan coba kembali.'
      : 'Processing timed out due to slow or unstable connection. Please try again.';
  }

  // 3. Gemini API Quota Exceeded / Rate Limit (HTTP 429)
  if (
    lower.includes('429') ||
    lower.includes('resource_exhausted') ||
    lower.includes('quota') ||
    lower.includes('too many requests') ||
    lower.includes('rate limit') ||
    lower.includes('rate_limit_exceeded')
  ) {
    return isIndonesian
      ? 'Batas kuota gratis Google Gemini AI per menit (Rate Limit) tercapai. Tunggu 10–30 detik lalu coba lagi.'
      : 'Gemini AI free tier rate limit reached. Please wait 10–30 seconds and try again.';
  }

  // 4. Gemini Model Deprecated / 404 Not Found
  if (
    lower.includes('404') ||
    lower.includes('model_not_found') ||
    lower.includes('not found for api version') ||
    lower.includes('is no longer available') ||
    lower.includes('not supported for generatecontent')
  ) {
    return isIndonesian
      ? 'Model AI Google sedang diperbarui. Pastikan API Key Anda aktif atau coba beberapa saat lagi.'
      : 'The AI model is currently being updated by Google. Please ensure your API Key is active or retry shortly.';
  }

  // 5. API Key Invalid / Expired / Missing
  if (
    lower.includes('api_key_invalid') ||
    lower.includes('api key not valid') ||
    lower.includes('api key belum diatur') ||
    lower.includes('api key tidak valid') ||
    lower.includes('invalid api key') ||
    lower.includes('apikey') ||
    lower.includes('key expired')
  ) {
    return isIndonesian
      ? 'API Key Google Gemini belum diatur atau tidak valid. Silakan periksa kembali API Key Anda di menu Pengaturan.'
      : 'Google Gemini API Key is missing or invalid. Please check your API Key in Settings.';
  }

  // 6. Max Output Tokens Exceeded / Truncated Response
  if (
    lower.includes('max_tokens') ||
    lower.includes('finish_reason_max_tokens') ||
    lower.includes('token terpotong')
  ) {
    return isIndonesian
      ? 'Respon data struk terpotong karena terlalu panjang. Silakan foto lebih dekat pada bagian rincian total.'
      : 'Receipt extraction was cut off due to length. Please take a closer photo of the total section.';
  }

  // 7. Server 500 / 503 / Unavailable
  if (
    lower.includes('500') ||
    lower.includes('503') ||
    lower.includes('internal server error') ||
    lower.includes('service unavailable') ||
    lower.includes('temporarily unavailable')
  ) {
    return isIndonesian
      ? 'Layanan Google AI sedang sibuk atau mengalami gangguan sementara. Silakan coba beberapa saat lagi.'
      : 'Google AI server is currently busy or experiencing temporary issues. Please try again shortly.';
  }

  // 8. JSON Parse / Structure Unrecognized
  if (
    lower.includes('json') ||
    lower.includes('parse') ||
    lower.includes('format respon ai tidak dapat dibaca') ||
    lower.includes('tidak memberikan respon')
  ) {
    return isIndonesian
      ? 'AI belum dapat mengenali rincian struk dengan jelas. Pastikan foto struk terang, tegak lurus, dan tidak buram.'
      : 'AI could not clearly extract receipt details. Please ensure the receipt photo is well-lit and not blurry.';
  }

  // 9. File / Image Reading Errors
  if (
    lower.includes('readasstringasync') ||
    lower.includes('gagal membaca file') ||
    lower.includes('file not found') ||
    lower.includes('image reading')
  ) {
    return isIndonesian
      ? 'Gagal memuat file gambar struk. Pastikan file gambar dalam kondisi baik dan dapat dibuka.'
      : 'Unable to load receipt image file. Please ensure the image is accessible.';
  }

  // Context-specific fallbacks
  switch (context) {
    case 'receipt_scan':
      return isIndonesian
        ? 'Pemindaian struk belum berhasil. Silakan ulangi pemindaian dengan foto yang lebih jelas atau catat manual.'
        : 'Receipt scanning failed. Please retry with a clearer photo or log the transaction manually.';

    case 'camera':
      return isIndonesian
        ? 'Kamera tidak dapat diakses atau pengambilan foto dibatalkan.'
        : 'Camera could not be accessed or photo capture was canceled.';

    case 'gallery':
      return isIndonesian
        ? 'Galeri foto tidak dapat diakses atau pemilihan gambar dibatalkan.'
        : 'Photo gallery could not be accessed or selection was canceled.';

    case 'document':
      return isIndonesian
        ? 'Dokumen tidak dapat dimuat. Pastikan file berformat Gambar atau PDF yang valid.'
        : 'Document could not be loaded. Please ensure it is a valid Image or PDF file.';

    case 'excel_export':
      return isIndonesian
        ? 'Gagal mengekspor laporan ke Excel. Pastikan ruang penyimpanan perangkat mencukupi.'
        : 'Failed to export report to Excel. Please ensure sufficient device storage.';

    case 'excel_import':
      return isIndonesian
        ? 'Gagal mengimpor file. Pastikan format kolom file Excel/CSV sudah sesuai petunjuk.'
        : 'Failed to import file. Please make sure the Excel/CSV format matches instructions.';

    case 'sync':
      return isIndonesian
        ? 'Sinkronisasi Google Drive mengalami kendala. Pastikan koneksi internet stabil dan coba kembali.'
        : 'Google Drive sync failed. Please verify your internet connection and try again.';

    default:
      return isIndonesian
        ? 'Terjadi kendala saat memproses permintaan. Silakan coba kembali.'
        : 'An issue occurred while processing your request. Please try again.';
  }
};

export default {
  getFriendlyErrorMessage,
};
