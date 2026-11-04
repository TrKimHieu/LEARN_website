// Hai hàm chạy trong trình duyệt, tách riêng để test được bằng `node --test`.

/** Thay chữ người dùng bằng chuỗi dài nhất, thêm nội dung khó vào bài đọc. Trả về số chỗ đã thay. */
export function stressPage() {
  const long =
    'Tên rất dài có nhiều chữ tiếng Việt ' +
    'KhoaHocKhongCoDauCach'.repeat(4) +
    ' và thêm nội dung cho đủ giới hạn của tên khóa học, tên bài học, tên tệp và câu hỏi trong bài';
  const items = document.querySelectorAll('[data-user-text]');
  items.forEach((el) => {
    el.textContent = long;
  });
  document.querySelectorAll('.lesson-content').forEach((el) => {
    el.insertAdjacentHTML(
      'beforeend',
      `<p>https://example.invalid/${'duong-dan-rat-dai/'.repeat(12)}</p>
       <pre><code>${'const giaTriRatDai = 1; '.repeat(20)}</code></pre>
       <table><tr>${'<th>Cột tiêu đề rất dài của bảng</th>'.repeat(12)}</tr></table>`,
    );
  });
  return items.length;
}

/** Liệt kê phần tử vượt mép màn hình hoặc tràn khỏi khối cha mà không có chỗ cuộn hay cắt. */
export function findOverflows() {
  const problems = [];
  const describe = (el) =>
    `<${el.tagName.toLowerCase()}> "${(el.textContent ?? '').trim().slice(0, 24)}"`;
  const clipped = (el) => {
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      const overflow = getComputedStyle(p).overflowX;
      if (overflow !== 'visible') return true;
    }
    return false;
  };
  const viewport = document.documentElement.clientWidth;
  if (document.documentElement.scrollWidth > viewport + 1) {
    problems.push(`trang cuộn ngang: ${document.documentElement.scrollWidth}px > ${viewport}px`);
  }
  document.querySelectorAll('main *, header *, nav *').forEach((el) => {
    const box = el.getBoundingClientRect();
    if (box.width === 0 || box.height === 0) return;
    if (el.closest('svg')) return;
    if ((box.right > viewport + 1 || box.left < -1) && !clipped(el)) {
      problems.push(`vượt mép màn hình: ${describe(el)}`);
    }
  });
  // Chữ thò ra ngoài khung của chính nút hoặc thẻ chứa nó.
  document.querySelectorAll('main a, main button, main li, main section').forEach((el) => {
    const style = getComputedStyle(el);
    if (style.overflowX !== 'visible') return;
    if (el.scrollWidth > el.clientWidth + 1 && el.clientWidth > 0 && !clipped(el)) {
      problems.push(`tràn khung: ${describe(el)} (${el.scrollWidth}px > ${el.clientWidth}px)`);
    }
  });
  // Tên chưa được khối cha cắt: chiếm quá nhiều dòng và đẩy bố cục xuống.
  document.querySelectorAll('[data-user-text=""]').forEach((el) => {
    // Phần tử inline báo chiều cao chưa cắt, nên đo ở khối gần nhất.
    let owner = el.parentElement;
    while (owner && getComputedStyle(owner).display === 'inline') owner = owner.parentElement;
    if (!owner) return;
    const lineHeight = parseFloat(getComputedStyle(owner).lineHeight) || 20;
    const height = owner.getBoundingClientRect().height;
    if (height > 0 && height / lineHeight > 4.5) {
      problems.push(`quá nhiều dòng (${Math.round(height / lineHeight)}): ${describe(owner)}`);
    }
  });
  return [...new Set(problems)];
}
