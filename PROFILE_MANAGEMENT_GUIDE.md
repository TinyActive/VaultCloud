# 🔐 User Profile Management - Implementation Guide

## ✅ Đã Hoàn Thành (Backend)

### 1. Database Migration
**File:** `worker/src/db/migration_004_user_profile_changes.sql`

Đã thêm các cột mới vào bảng `users`:
- `must_change_password` - Cờ bắt buộc đổi mật khẩu
- `email_changed_at` - Timestamp khi email được đổi
- `original_email` - Email gốc (để audit)

### 2. API Endpoints Mới
**File:** `worker/src/handlers/auth.ts`

✅ `handleChangePassword(request, env, userId)` - POST `/api/auth/change-password`
- Đổi mật khẩu
- Xác thực mật khẩu hiện tại
- Tự động clear flag `must_change_password`

✅ `handleChangeEmail(request, env, userId)` - POST `/api/auth/change-email`
- Đổi email (CHỈ MỘT LẦN)
- Kiểm tra `email_changed_at` để ngăn đổi lại
- Xác thực password
- Lưu `original_email` và `email_changed_at`

### 3. Routes Updated
**File:** `worker/src/index.ts`

```typescript
// Đã thêm routes:
POST /api/auth/change-password
POST /api/auth/change-email
```

### 4. Types Updated
**File:** `worker/src/types/index.ts`

Đã thêm vào `User` interface:
```typescript
must_change_password?: number;
email_changed_at?: number;
original_email?: string;
```

## ✅ Đã Hoàn Thành (Frontend)

### 1. API Service Methods
**File:** `services/apiService.ts`

```typescript
async changePassword(currentPassword: string, newPassword: string)
async changeEmail(newEmail: string, password: string)
```

### 2. Modal Components

#### ChangePasswordModal (Đã cập nhật)
**File:** `components/modals/ChangePasswordModal.tsx`
- ✅ Form validation đầy đủ
- ✅ Gọi API `changePassword`
- ✅ Hiển thị success/error messages
- ✅ Tự động close sau 2s khi thành công

#### ChangeEmailModal (Mới)
**File:** `components/modals/ChangeEmailModal.tsx`
- ✅ Hiển thị cảnh báo "one-time change"
- ✅ Block nếu đã đổi email rồi
- ✅ Validation email format
- ✅ Yêu cầu nhập password xác nhận

#### ForceProfileUpdateModal (Mới)
**File:** `components/modals/ForceProfileUpdateModal.tsx`
- ✅ Modal không thể tắt (bắt buộc)
- ✅ 3 bước: Info → Email → Password
- ✅ Hướng dẫn rõ ràng
- ✅ Success animation khi hoàn thành

### 3. Settings View Updated
**File:** `views/dashboard/SettingsView.tsx`
- ✅ Hiển thị email hiện tại
- ✅ Hiển thị ngày đổi email (nếu có)
- ✅ Button "Change Email" và "Change Password"

## 📋 Còn Cần Làm (Integration)

### Bước 1: Cập nhật DashboardView.tsx

Thêm state và handlers:

```typescript
// Add to imports
import ChangeEmailModal from '../components/modals/ChangeEmailModal';
import ForceProfileUpdateModal from '../components/modals/ForceProfileUpdateModal';

// Add states
const [isChangeEmailModalOpen, setChangeEmailModalOpen] = useState(false);
const [showForceProfileUpdate, setShowForceProfileUpdate] = useState(false);
const [userEmail, setUserEmail] = useState('');
const [emailChangedAt, setEmailChangedAt] = useState<number | undefined>();

// Trong useEffect load user data:
useEffect(() => {
    const loadUserData = async () => {
        try {
            const userData = await apiService.getMe();
            setUser(userData);
            setUserEmail(userData.email);
            setEmailChangedAt(userData.email_changed_at);
            
            // Check if must change password
            if (userData.must_change_password === 1) {
                setShowForceProfileUpdate(true);
            }
        } catch (error) {
            console.error('Failed to load user data:', error);
        }
    };
    loadUserData();
}, []);

// Add handlers
const handleEmailChanged = (newEmail: string) => {
    setUserEmail(newEmail);
    setEmailChangedAt(Math.floor(Date.now() / 1000));
    // Reload user data
    apiService.getMe().then(data => setUser(data));
};

const handleProfileUpdateComplete = () => {
    setShowForceProfileUpdate(false);
    // Reload user data
    apiService.getMe().then(data => {
        setUser(data);
        setUserEmail(data.email);
    });
};
```

### Bước 2: Update SettingsView Props

```typescript
<SettingsView
    is2FAEnabled={is2FAEnabled}
    fidoKeys={fidoKeys}
    isPasswordLoginEnabled={isPasswordLoginEnabled}
    pgpKey={pgpKey}
    userEmail={userEmail}
    emailChangedAt={emailChangedAt}
    onToggle2FA={() => setSetup2FAModalOpen(true)}
    onChangePassword={() => setChangePasswordModalOpen(true)}
    onChangeEmail={() => setChangeEmailModalOpen(true)} // NEW
    onExport={handleExportData}
    onImport={() => setImportDataModalOpen(true)}
    onAddFidoKey={() => setRegisterFidoKeyModalOpen(true)}
    onRemoveFidoKey={handleRemoveFidoKey}
    onTogglePasswordLogin={handleTogglePasswordLogin}
    onManagePgpKey={() => setPgpSettingsModalOpen(true)}
    onRemovePgpKey={handleRemovePgpKey}
/>
```

### Bước 3: Add Modals to Render

```tsx
{/* At the end of render, with other modals */}

{/* Change Email Modal */}
{isChangeEmailModalOpen && (
    <ChangeEmailModal
        isOpen={isChangeEmailModalOpen}
        onClose={() => setChangeEmailModalOpen(false)}
        currentEmail={userEmail}
        emailChangedAt={emailChangedAt}
        onSuccess={handleEmailChanged}
    />
)}

{/* Force Profile Update Modal (First Login) */}
{showForceProfileUpdate && (
    <ForceProfileUpdateModal
        isOpen={showForceProfileUpdate}
        currentEmail={userEmail}
        onSuccess={handleProfileUpdateComplete}
    />
)}
```

### Bước 4: Thêm Translations

**File:** `locales/en.json` và `locales/vi.json`

```json
{
  "changeEmail": "Change Email",
  "newEmail": "New Email",
  "currentEmail": "Current Email",
  "emailChangedOn": "Email was changed on",
  "emailAlreadyChanged": "Email can only be changed once. You have already changed your email.",
  "emailChangeWarning": "You can only change your email once. Make sure to enter the correct email address.",
  "oneTimeChangeOnly": "This is a ONE-TIME change. You will not be able to change your email again.",
  "emailMustBeDifferent": "New email must be different from current email",
  "changeEmailError": "Failed to change email",
  "emailChangedSuccess": "Email changed successfully!",
  "viewEmailChange": "View Email Change",
  
  "welcomeFirstLogin": "🎉 Welcome! First Time Setup",
  "firstLoginDesc": "For security reasons, you must change your email and password on first login.",
  "changeEmailRequired": "📧 Change Your Email",
  "changePasswordRequired": "🔒 Change Your Password",
  "securityNotice": "🔐 Security Notice",
  "mustChangeEmail": "You must change your default email address",
  "emailCanChangeOnce": "Email can only be changed ONCE",
  "mustChangePassword": "You must set a new secure password",
  "passwordRequirement": "Password must be at least 8 characters",
  "setupComplete": "Setup Complete!",
  "redirecting": "Redirecting to your dashboard...",
  
  "allFieldsRequired": "All fields are required",
  "invalidEmailFormat": "Invalid email format",
  "passwordMinLength": "Password must be at least 8 characters",
  "passwordsDoNotMatch": "Passwords do not match",
  "confirmPassword": "Confirm Password",
  "enterPasswordToConfirm": "Enter your password to confirm",
  "saving": "Saving...",
  "continue": "Continue",
  "close": "Close"
}
```

### Bước 5: Deploy Migration

Trong `.github/workflows/deploy.yml`, migration 004 sẽ tự động chạy. Hoặc chạy thủ công:

```bash
# Local
wrangler d1 execute vaultcloud-db --file=./worker/src/db/migration_004_user_profile_changes.sql --local

# Production
wrangler d1 execute vaultcloud-db --file=./worker/src/db/migration_004_user_profile_changes.sql --remote
```

## 🎯 User Flow

### Flow 1: User Đăng Nhập Lần Đầu
1. Login với email/password mặc định
2. `must_change_password = 1` → Hiện `ForceProfileUpdateModal`
3. Bước 1: Thông báo yêu cầu
4. Bước 2: Đổi email (một lần duy nhất)
5. Bước 3: Đổi password
6. Hoàn thành → Redirect to dashboard

### Flow 2: User Muốn Đổi Email (Settings)
1. Vào Settings → Click "Change Email"
2. Nếu chưa đổi lần nào:
   - Hiện modal với cảnh báo
   - Nhập email mới + password
   - Xác nhận → Email thay đổi
3. Nếu đã đổi rồi:
   - Hiện modal thông báo đã đổi
   - Không cho đổi nữa

### Flow 3: User Đổi Password (Settings)
1. Vào Settings → Click "Change Master Password"
2. Nhập current password
3. Nhập new password + confirm
4. Success message hiện ra
5. Auto close sau 2s

## 🔒 Security Features

✅ **One-Time Email Change**
- Email chỉ đổi được 1 lần
- Tracked bằng `email_changed_at`
- Lưu `original_email` để audit

✅ **Password Validation**
- Yêu cầu current password để đổi
- Min 8 characters
- Confirm password match

✅ **Force First Login Update**
- Users với default emails phải đổi
- Modal không thể dismiss
- Phải hoàn thành cả email + password

✅ **Audit Trail**
- `original_email` lưu email gốc
- `email_changed_at` track thời gian
- `last_login` update mỗi lần login

## 🧪 Testing

### Test Cases

1. **First Login Flow**
   - Login với `admin@vaultcloud.dev` / `admin123`
   - Verify modal xuất hiện
   - Đổi email → Verify success
   - Đổi password → Verify success
   - Login lại với email mới

2. **Email Change Restriction**
   - Đổi email lần 1 → Success
   - Thử đổi lần 2 → Blocked with message

3. **Password Change**
   - Wrong current password → Error
   - Passwords don't match → Error
   - Too short password → Error
   - Valid change → Success message

4. **Settings Display**
   - Email hiển thị đúng
   - Ngày đổi email hiển thị (nếu có)
   - Button state thay đổi theo trạng thái

## 📝 Notes

- Migration 004 tự động set `must_change_password = 1` cho default users
- `email_changed_at` = NULL nghĩa là chưa đổi email
- Success messages tự động biến mất sau 2 seconds
- Modals có proper loading states
- Error messages được translate

---

**Created:** 2025-11-07
**Status:** ✅ Backend Complete | ⏳ Frontend Integration Needed
