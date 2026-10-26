package com.satarksaathi.app.core.network

sealed class Resource<out T> {
    data class Success<out T>(val data: T) : Resource<T>()
    data class Error(val message: String, val code: Int? = null) : Resource<Nothing>()
    data object Loading : Resource<Nothing>()
    data object Idle : Resource<Nothing>()
}
