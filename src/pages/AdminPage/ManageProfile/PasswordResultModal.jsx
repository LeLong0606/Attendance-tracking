import { useToast } from "../../../hooks/useToast";

function PasswordResultModal({ isOpen, password, username, onClose }) {
  const { showToast } = useToast();

  const handleCopy = (text) => {
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      showToast("Đã copy mật khẩu!", "success");
    } catch (error) {
      showToast("Copy thất bại!", "error");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-header">Tạo tài khoản thành công!</h2>
        <div style={{ marginBottom: "1.5rem" }}>
          <p style={{ marginBottom: "0.5rem" }}>Mật khẩu của {username} là:</p>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <input
              type="text"
              value={password}
              readOnly
              style={{
                flex: 1,
                padding: "10px 12px",
                border: "1.5px solid #dbdfe6",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: "600",
              }}
            />
            <button
              onClick={() => handleCopy(password)}
              style={{
                padding: "10px 16px",
                backgroundColor: "#667eea",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                whiteSpace: "nowrap",
              }}
            >
              <i className="fa-solid fa-copy"></i> Copy
            </button>
          </div>
          <p style={{ marginTop: "0.5rem", fontSize: "12px", color: "red" }}>
            Vui lòng lưu lại mật khẩu này và cấp cho nhân viên để đăng nhập.
          </p>
        </div>
        <button
          onClick={onClose}
          style={{
            width: "100%",
            padding: "10px",
            backgroundColor: "#667eea",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          Đóng
        </button>
      </div>
    </div>
  );
}

export default PasswordResultModal;