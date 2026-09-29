# Git cơ bản cho người mới bắt đầu

Tài liệu này giới thiệu Git, hệ thống quản lý phiên bản phân tán được dùng rộng rãi nhất hiện nay.
Sau khi đọc xong, bạn sẽ biết cách lưu lại lịch sử thay đổi của một dự án, làm việc với nhánh và
đồng bộ mã nguồn với kho lưu trữ từ xa.

## 1. Git là gì và vì sao cần quản lý phiên bản

Git là một hệ thống quản lý phiên bản (version control system). Nó ghi lại mọi thay đổi trong các
tệp của dự án theo thời gian, để bạn có thể xem lại ai đã sửa gì, khi nào và vì sao, hoặc quay về
một trạng thái cũ khi cần.

Git là hệ thống **phân tán**: mỗi người tham gia dự án có một bản sao đầy đủ của toàn bộ lịch sử
trên máy mình. Nhờ vậy, phần lớn thao tác như xem lịch sử hay tạo nhánh diễn ra ngay trên máy, không
cần kết nối mạng, và dự án không phụ thuộc vào một máy chủ duy nhất.

Git được Linus Torvalds tạo ra vào năm 2005 để quản lý mã nguồn nhân Linux.

## 2. Ba vùng làm việc: thư mục làm việc, vùng chờ và kho lưu trữ

Một tệp trong dự án Git luôn nằm ở một trong ba vùng:

- **Thư mục làm việc** (working directory): nơi bạn trực tiếp sửa tệp.
- **Vùng chờ** (staging area, còn gọi là index): nơi bạn chọn những thay đổi sẽ đưa vào lần lưu kế tiếp.
- **Kho lưu trữ** (repository): nơi Git lưu vĩnh viễn các lần lưu, gọi là commit.

Quy trình thường ngày vì thế gồm hai bước: đưa thay đổi vào vùng chờ bằng `git add`, rồi ghi chúng
thành một commit bằng `git commit`.

```bash
git init                      # tạo kho Git mới trong thư mục hiện tại
git status                    # xem tệp nào đã sửa, tệp nào đã ở vùng chờ
git add index.html            # đưa một tệp vào vùng chờ
git commit -m "Thêm trang chủ"  # ghi vùng chờ thành một commit
```

## 3. Commit và lịch sử dự án

Mỗi commit là một ảnh chụp toàn bộ dự án tại một thời điểm, kèm theo tác giả, thời gian và thông
điệp mô tả. Mỗi commit có một mã định danh duy nhất (mã băm SHA-1 dài 40 ký tự) và trỏ tới commit
cha của nó, nên các commit nối nhau thành lịch sử của dự án.

Một thông điệp commit tốt nói rõ **vì sao** có thay đổi, không chỉ thay đổi cái gì. Mỗi commit nên
chứa một thay đổi có ý nghĩa trọn vẹn, để khi cần có thể hoàn tác đúng phần đó mà không ảnh hưởng
phần khác.

```bash
git log --oneline             # xem lịch sử, mỗi commit một dòng
git diff                      # xem thay đổi chưa đưa vào vùng chờ
git diff --staged             # xem thay đổi đã ở vùng chờ
```

## 4. Nhánh và gộp nhánh

Nhánh (branch) là một con trỏ nhẹ tới một commit. Tạo nhánh cho phép bạn phát triển một tính năng
mới tách biệt khỏi nhánh chính, không làm ảnh hưởng tới mã đang ổn định. Nhánh mặc định thường tên
là `main`.

Khi tính năng hoàn thành, bạn gộp (merge) nhánh đó trở lại nhánh chính. Nếu cả hai nhánh cùng sửa
một đoạn trong cùng một tệp, Git không tự quyết được và báo **xung đột** (merge conflict); bạn phải
tự chọn nội dung đúng rồi commit lại.

```bash
git switch -c tinh-nang-dang-nhap   # tạo nhánh mới và chuyển sang đó
git switch main                     # quay về nhánh chính
git merge tinh-nang-dang-nhap       # gộp nhánh tính năng vào main
```

Trong đoạn mã bị xung đột, Git đánh dấu hai phiên bản bằng các dòng `<<<<<<<`, `=======` và
`>>>>>>>`. Bạn xoá các dấu này, giữ lại nội dung đúng, rồi `git add` và `git commit`.

## 5. Làm việc với kho từ xa

Kho từ xa (remote) là một bản sao của kho lưu trữ nằm trên máy chủ, ví dụ trên GitHub hoặc GitLab.
Nó là nơi các thành viên trong nhóm chia sẻ commit với nhau.

- `git clone <địa chỉ>` tải về toàn bộ một kho từ xa.
- `git push` gửi các commit trên máy bạn lên kho từ xa.
- `git pull` lấy commit mới từ kho từ xa về và gộp vào nhánh hiện tại.
- `git fetch` chỉ tải commit mới về mà chưa gộp, để bạn xem trước.

Trước khi `push`, nên `pull` để cập nhật những thay đổi người khác đã đẩy lên, tránh bị từ chối vì
lịch sử đã khác nhau.

## 6. Hoàn tác thay đổi an toàn

Git có nhiều cách hoàn tác, với mức độ an toàn khác nhau:

| Lệnh | Tác dụng | Có viết lại lịch sử không |
| --- | --- | --- |
| `git restore <tệp>` | Bỏ thay đổi chưa commit trong thư mục làm việc | Không |
| `git revert <commit>` | Tạo commit mới đảo ngược một commit cũ | Không |
| `git reset --hard <commit>` | Đưa nhánh về commit cũ, xoá các commit sau đó | Có |

Với nhánh đã chia sẻ cho người khác, hãy dùng `git revert` thay vì `git reset`, vì viết lại lịch sử
đã chia sẻ sẽ làm lệch kho của các thành viên còn lại.
