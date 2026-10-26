# R8 / ProGuard rules for Satark Saathi

# Kotlinx Serialization
-keepattributes *Annotation*, InnerClasses
-dontnote kotlinx.serialization.SerializationKt
-keepclassmembers class * {
    @kotlinx.serialization.SerialName <fields>;
}
-keep,allowobfuscation,allowshrinking class * {
    @kotlinx.serialization.Serializable class *;
}
-keepclassmembers class * {
    kotlinx.serialization.KSerializer serializer(...);
}

# Retrofit & OkHttp
-dontwarn okio.**
-dontwarn javax.annotation.**
-keepattributes Signature
-keepattributes Exceptions
-keepclasseswithmembers class * {
    @retrofit2.http.* <methods>;
}

# Google ErrorProne & Tink Annotations
-dontwarn com.google.errorprone.annotations.**
-dontwarn org.checkerframework.**
-dontwarn com.google.crypto.tink.**

# Keep Data Models
-keep class com.satarksaathi.app.data.models.** { *; }

# Compose rules
-keep class androidx.compose.material3.** { *; }
