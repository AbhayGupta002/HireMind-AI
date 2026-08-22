package com.talentiq.service.user;

import com.talentiq.dto.user.UserDto;

public interface UserService {

    UserDto.Response getUserProfile(Long userId);

    UserDto.Response updateUserProfile(Long userId, UserDto.UpdateProfileRequest request);

    void changePassword(Long userId, UserDto.ChangePasswordRequest request);
}
