import { 
    msg,
    __validateInputEmail, 
    __validateInputPassword,
    __validateInputNickname
} from "./validation.js";
import { __postFetch } from "./api.js";


export function initJoinPage() {
    profileImageUploadHandler();
    validateJoinInput();
}

function profileImageUploadHandler() {
    const $inputProfileImage = document.getElementById('inputProfileImage');
    const $profilaImageDummyView = document.getElementById('profilaImageDummyView');
    const $profileImageView = document.getElementById('profileImageView');
    const $profileImageUrl = document.getElementById('profileImageUrl');

    let currentObjectUrl = null;

    $inputProfileImage.addEventListener("change", async (e) => {
        const file = e.target.files[0];
        if (!file) {
            $profilaImageDummyView.classList.remove('hide');
            $profileImageView.classList.add("hide");
            $profileImageUrl.value = "";
            return;
        }
        
        if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl);
        currentObjectUrl = URL.createObjectURL(file);
        $profilaImageDummyView.classList.add("hide");
        $profileImageView.classList.remove("hide");
        $profileImageView.src = URL.createObjectURL(file);

        /**
         * 이미지 크기 또는 확장자 검증은 요구사항에 없었음.
         * 이미지 업로드는 나중에 구현 예정
         */

        try {
            const res = await __uploadFile("/upload/image", file);
            if (!res.ok) {
                alert("구현 예정!")
                throw new Error("이미지 업로드에 실패했습니다.");
            }
        } catch (error) {
            alert("구현 예정!");
        } finally {
            $profileImageUrl.value = "dummy image";
        }
    });
}

function validateJoinInput() {
    const $form = document.getElementById('join-form');

    const $hintEmail = document.getElementById('hintEmail');
    const $hintPassword = document.getElementById('hintPassword');
    const $hintPasswordCheck = document.getElementById('hintPasswordCheck');
    const $hintNickname = document.getElementById('hintNickname');

    inputValidateHandler($form.inputEmail, $hintEmail, __validateInputEmail);
    inputValidateHandler($form.inputPassword, $hintPassword, __validateInputPassword);

    $form.inputPasswordCheck.addEventListener('input', () => {
        if ($form.inputPassword.value !== $form.inputPasswordCheck.value) {
            $hintPasswordCheck.textContent = msg['password-confirm-mismatch'];
        } else {
            $hintPasswordCheck.textContent = "";
        }
    });
    inputValidateHandler($form.inputNickname, $hintNickname, __validateInputNickname);
}

function inputValidateHandler($target, $hint, __validateFunc) {
    $target.addEventListener('input', () => {
        const validate = __validateFunc($target.value);
        if (!validate.ok) {
            $hint.textContent = validate.msg;
        } else {
            $hint.textContent = "";
        }
    });
}

export function joinSubmitHandler() {
    
    const $form = document.getElementById('join-form');
    $form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const res = await __postFetch("/auth/signup", { 
            email: $form.inputEmail.value, 
            password: $form.inputPassword.value, 
            nickname: $form.inputNickname.value,
            profile_image_url: $form.profileImageUrl.value
        });


        if (!res.ok) {
            let message = "회원가입 실패";
            alert("네트워크 오류!");
            throw new Error(message);
        } else {
            alert("회원가입 성공. 로그인 후 이용 바랍니다.");
        }

        // 로그인 유도
        window.location.href = "/index.html";
    });
}
