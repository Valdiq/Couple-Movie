package vladyslav.stasyshyn.couple_movie.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vladyslav.stasyshyn.couple_movie.model.CoupleRequest;
import vladyslav.stasyshyn.couple_movie.model.RequestStatus;
import vladyslav.stasyshyn.couple_movie.model.User;

import java.util.List;
import java.util.Optional;

@Repository
public interface CoupleRequestRepository extends JpaRepository<CoupleRequest, Long> {
    List<CoupleRequest> findByReceiverEmailAndStatus(String email, RequestStatus status);

    List<CoupleRequest> findBySender(User sender);

    Optional<CoupleRequest> findBySenderAndReceiverEmailAndStatus(User sender, String receiverEmail,
            RequestStatus status);

    List<CoupleRequest> findBySenderIdAndStatus(Long senderId, RequestStatus status);

    List<CoupleRequest> findByReceiverEmailAndStatusIn(String email, List<RequestStatus> statuses);
}
