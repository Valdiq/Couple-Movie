package vladyslav.stasyshyn.couple_movie.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vladyslav.stasyshyn.couple_movie.entity.CoupleRequest;
import vladyslav.stasyshyn.couple_movie.entity.User;
import vladyslav.stasyshyn.couple_movie.model.RequestStatus;
import vladyslav.stasyshyn.couple_movie.repository.CoupleRequestRepository;
import vladyslav.stasyshyn.couple_movie.repository.UserRepository;

import java.util.List;
import java.util.Objects;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CoupleService {

    private final CoupleRequestRepository coupleRequestRepository;
    private final UserRepository userRepository;

    @Transactional
    public CoupleRequest sendInvite(User sender, String receiverUsername) {
        if (sender.getPartnerId() != null) {
            throw new IllegalStateException("You already have a partner.");
        }
        if (sender.getDisplayUsername() != null && sender.getDisplayUsername().equals(receiverUsername)) {
            throw new IllegalArgumentException("You cannot invite yourself.");
        }

        User receiver = userRepository.findByDisplayUsername(receiverUsername)
                .orElseThrow(
                        () -> new IllegalArgumentException("User with username '" + receiverUsername + "' not found."));

        if (receiver.getPartnerId() != null) {
            throw new IllegalStateException("This user already has a partner.");
        }

        Optional<CoupleRequest> existingRequest = coupleRequestRepository
                .findBySenderAndReceiverEmailAndStatus(sender, receiver.getEmail(), RequestStatus.PENDING);

        if (existingRequest.isPresent()) {
            return existingRequest.get();
        }

        CoupleRequest request = CoupleRequest.builder()
                .sender(sender)
                .receiverEmail(receiver.getEmail())
                .status(RequestStatus.PENDING)
                .build();

        return coupleRequestRepository.save(Objects.requireNonNull(request));
    }

    @Transactional
    public void acceptInvite(User receiver, Long requestId) {
        CoupleRequest request = coupleRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Request not found"));

        if (!request.getReceiverEmail().equals(receiver.getEmail())) {
            throw new IllegalArgumentException("This request is not for you");
        }
        if (request.getStatus() != RequestStatus.PENDING) {
            throw new IllegalStateException("Request is already " + request.getStatus());
        }

        User sender = request.getSender();

        sender.setPartnerId(receiver.getId());
        receiver.setPartnerId(sender.getId());

        userRepository.save(sender);
        userRepository.save(receiver);

        request.setStatus(RequestStatus.ACCEPTED);
        coupleRequestRepository.save(request);
    }

    @Transactional
    public void rejectInvite(User receiver, Long requestId) {
        CoupleRequest request = coupleRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Request not found"));

        if (!request.getReceiverEmail().equals(receiver.getEmail())) {
            throw new IllegalArgumentException("This request is not for you");
        }

        request.setStatus(RequestStatus.REJECTED);
        coupleRequestRepository.save(request);
    }

    public List<CoupleRequest> getReceivedInvites(User user) {
        return coupleRequestRepository.findByReceiverEmailAndStatus(user.getEmail(), RequestStatus.PENDING);
    }

    public Optional<User> getPartner(User user) {
        if (user.getPartnerId() == null) {
            return Optional.empty();
        }
        return userRepository.findById(user.getPartnerId());
    }

    @Transactional
    public void breakCouple(User user) {
        if (user.getPartnerId() == null) {
            throw new IllegalStateException("You don't have a partner to unlink.");
        }

        User partner = userRepository.findById(user.getPartnerId())
                .orElseThrow(() -> new IllegalStateException("Partner not found."));

        user.setPartnerId(null);
        partner.setPartnerId(null);
        userRepository.save(user);
        userRepository.save(partner);

        coupleRequestRepository.findByUserAndStatus(user.getId(), user.getEmail(), RequestStatus.ACCEPTED)
                .forEach(req -> {
                    req.setStatus(RequestStatus.BROKEN);
                    coupleRequestRepository.save(req);
                });
    }
}
