package vladyslav.stasyshyn.couple_movie.dto;

import vladyslav.stasyshyn.couple_movie.entity.User;

public record UserProfileResponse(
        Long id,
        String email,
        String firstname,
        String lastname,
        String full_name,
        String role,
        String avatar_url,
        String username,
        String created_date,
        boolean is_verified,
        Long partner_id) {
    public static UserProfileResponse fromUser(User user) {
        String fName = user.getFirstName() != null ? user.getFirstName() : "";
        String lName = user.getLastName() != null ? user.getLastName() : "";

        return new UserProfileResponse(
                user.getId(),
                user.getEmail(),
                fName,
                lName,
                (fName + " " + lName).trim(),
                user.getRole().name(),
                user.getAvatarUrl(),
                user.getDisplayUsername(),
                user.getCreatedDate() != null ? user.getCreatedDate().toString() : null,
                user.isVerified(),
                user.getPartnerId());
    }
}
