package vladyslav.stasyshyn.couple_movie.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vladyslav.stasyshyn.couple_movie.entity.CoupleRequest;
import vladyslav.stasyshyn.couple_movie.entity.User;
import vladyslav.stasyshyn.couple_movie.model.RequestStatus;
import java.util.List;
import java.util.Optional;

@Repository
public interface CoupleRequestRepository extends JpaRepository<CoupleRequest, Long> {
    List<CoupleRequest> findByReceiverEmailAndStatus(String email, RequestStatus status);

    Optional<CoupleRequest> findBySenderAndReceiverEmailAndStatus(User sender, String receiverEmail,
            RequestStatus status);

    List<CoupleRequest> findBySenderIdAndStatus(Long senderId, RequestStatus status);

    List<CoupleRequest> findByReceiverEmailAndStatusIn(String email, List<RequestStatus> statuses);

    List<CoupleRequest> findBySenderIdOrReceiverEmailAndStatus(Long senderId, String receiverEmail,
            RequestStatus status);

    @Query("SELECT cr FROM CoupleRequest cr WHERE (cr.sender.id = :userId OR cr.receiverEmail = :email) AND cr.status = :status")
    List<CoupleRequest> findByUserAndStatus(@Param("userId") Long userId, @Param("email") String email,
            @Param("status") RequestStatus status);
}
