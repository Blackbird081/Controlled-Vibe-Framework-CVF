📄 OPERATOR_GOLDEN_PATH.md

The Only Way to Use CVF (Operator Edition)

Golden Path

CVF chỉ có 1 cách sử dụng hợp lệ.

1. Write Input (use input_template.md)
2. Lock Input
3. Run Execution
4. Receive Output + Trace
5. Audit (Output → Trace → Boundary)
6. Log Result
7. Stop

Không rẽ nhánh.
Không tối ưu.
Không làm thêm.

Operator được phép làm gì ở mỗi bước?
| Step | Operator Action          |
| ---- | ------------------------ |
| 1    | Viết input theo contract |
| 2    | Không sửa nữa            |
| 3    | Không hiện diện          |
| 4    | Nhận kết quả             |
| 5    | Audit lạnh               |
| 6    | Ghi log                  |
| 7    | Kết thúc                 |


Nếu bạn phải nghĩ thêm bước 8 → bạn đang dùng sai CVF.

Quy tắc Golden Path

Mỗi execution = 1 lần đi trọn đường.

Không quay đầu.
Không “thử lại nhanh”.
Không “làm cho tiện”.

End of Golden Path.
