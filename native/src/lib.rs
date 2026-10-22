use napi_derive::napi;

#[napi(object)]
pub struct NativeInfo {
    pub version: String,
    pub platform: String,
    pub architecture: String,
}

// 用真实原生调用验证构建和分发链路；录音与推理能力在后续任务中单独接入。
#[napi]
pub fn get_native_info() -> NativeInfo {
    NativeInfo {
        version: env!("CARGO_PKG_VERSION").to_owned(),
        platform: std::env::consts::OS.to_owned(),
        architecture: std::env::consts::ARCH.to_owned(),
    }
}
