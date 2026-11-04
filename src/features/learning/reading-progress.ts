/** Đã kéo tới cuối nội dung chưa: mốc nằm trong màn hình, trừ phần thanh dính đáy che. */
export function isEndReached(markerTop: number, viewportHeight: number, coveredBottom = 96) {
  return markerTop <= viewportHeight - coveredBottom;
}
